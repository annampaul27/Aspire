import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.models.ats import (
    ResumeSchema,
    JDSchema,
    ComparisonResultSchema,
    JDRequest,
    QueryRequest,
)
from app.services.ats.parser_service import extract_text, parse_resume, parse_jd
from app.services.ats.matching_service import compare_resume_to_jd
from app.services.ats.vector_service import (
    store_resume,
    store_jd,
    query_matching_resumes,
    query_matching_jds,
)

router = APIRouter(prefix="/ats", tags=["ATS & Skill Matching Engine"])

@router.get("/status")
async def ats_status():
    """
    ATS Engine health & telemetry endpoint with contributor credits.
    """
    return {
        "status": "online",
        "engine": "Aspire AI ATS AI Parser & ChromaDB Matching Engine",
        "compliance": ["E1", "E2", "E3", "E4", "E10", "NF1", "NF2"],
        "contributor": {
            "name": "Annam Paul",
            "github": "annampaul27",
            "role": "ATS Parser & Vector Search Architect"
        }
    }

@router.post("/parse-resume", response_model=ResumeSchema)
async def api_parse_resume(file: UploadFile = File(...)):
    """
    Ingest a candidate resume (.pdf, .docx, .txt), extract text, parse structured skills,
    work experience, and index into ChromaDB (E10, S1, S2).
    """
    try:
        file_bytes = await file.read()
        raw_text = await extract_text(file_bytes, file.filename)
        resume_data = parse_resume(raw_text)
        
        # Store in ChromaDB vector repository
        resume_id = str(uuid.uuid4())
        store_resume(resume_id, resume_data)
        
        return resume_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume parsing error: {str(e)}")

@router.post("/parse-jd", response_model=JDSchema)
async def api_parse_jd(request: JDRequest):
    """
    Parse a raw Job Description into structured Critical (Must-Have, weight=3.0)
    and Optional (Nice-to-Have, weight=1.0) skills (E1, E2).
    """
    try:
        jd_data = parse_jd(request.raw_text)
        
        # Store in ChromaDB
        jd_id = str(uuid.uuid4())
        store_jd(jd_id, jd_data)
        
        return jd_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JD parsing error: {str(e)}")

@router.post("/compare", response_model=ComparisonResultSchema)
async def api_compare(
    resume_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    jd_text: str = Form(...)
):
    """
    Compare a Candidate's Resume to a Job Description using the Weighted Deficit
    Resistance Model, categorizing into Job-Ready, Bridgeable, or Mismatch (E3, E4).
    """
    try:
        # 1. Parse Resume
        if resume_file:
            file_bytes = await resume_file.read()
            raw_resume_text = await extract_text(file_bytes, resume_file.filename)
        elif resume_text:
            raw_resume_text = resume_text
        else:
            raise HTTPException(status_code=400, detail="Must provide either resume_file or resume_text")
            
        resume_data = parse_resume(raw_resume_text)
        
        # 2. Parse JD
        jd_data = parse_jd(jd_text)
        
        # 3. Compare using deterministic skill gap & Deficit Resistance Model
        comparison_result = compare_resume_to_jd(resume_data, jd_data)
        
        # 4. Store both in ChromaDB for future querying
        store_resume(str(uuid.uuid4()), resume_data)
        store_jd(str(uuid.uuid4()), jd_data)
        
        return comparison_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison error: {str(e)}")

@router.post("/query/resumes")
async def api_query_resumes(request: QueryRequest):
    """
    Find resumes that semantically match a given job description text using ChromaDB embeddings.
    """
    try:
        return query_matching_resumes(request.query_text, request.n_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume query error: {str(e)}")

@router.post("/query/jds")
async def api_query_jds(request: QueryRequest):
    """
    Find job descriptions that semantically match a given resume text using ChromaDB embeddings.
    """
    try:
        return query_matching_jds(request.query_text, request.n_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JD query error: {str(e)}")
