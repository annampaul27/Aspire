import os
from typing import Dict, Any
from app.models.ats import ResumeSchema, JDSchema

# Initialize ChromaDB Persistent Client with safe fallback
CHROMA_PATH = os.environ.get("CHROMA_DB_PATH", "./chroma_db")
_chroma_client = None
_resume_collection = None
_jd_collection = None

# In-memory fallback if chromadb is not yet loaded
_in_memory_resumes: Dict[str, Dict[str, Any]] = {}
_in_memory_jds: Dict[str, Dict[str, Any]] = {}

def get_chroma_collections():
    global _chroma_client, _resume_collection, _jd_collection
    if _resume_collection is not None and _jd_collection is not None:
        return _resume_collection, _jd_collection
    
    try:
        import chromadb
        _chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
        _resume_collection = _chroma_client.get_or_create_collection(name="resumes")
        _jd_collection = _chroma_client.get_or_create_collection(name="jds")
        return _resume_collection, _jd_collection
    except Exception as e:
        print(f"[VectorService] ChromaDB warning (using in-memory fallback): {e}")
        return None, None

def store_resume(resume_id: str, resume_data: ResumeSchema):
    skills_text = ", ".join(resume_data.skills)
    document_text = f"Candidate: {resume_data.name}. Skills: {skills_text}. Summary: {resume_data.summary}"
    
    resume_col, _ = get_chroma_collections()
    if resume_col:
        try:
            resume_col.add(
                documents=[document_text],
                metadatas=[{
                    "name": resume_data.name,
                    "email": resume_data.email or "",
                    "skills_count": len(resume_data.skills),
                }],
                ids=[resume_id]
            )
            return
        except Exception as e:
            print(f"[VectorService] ChromaDB store_resume error: {e}")
            
    _in_memory_resumes[resume_id] = {
        "document": document_text,
        "metadata": {"name": resume_data.name, "skills": resume_data.skills},
        "id": resume_id
    }

def store_jd(jd_id: str, jd_data: JDSchema):
    skills_text = ", ".join(jd_data.mandatory_skills + jd_data.nice_to_have_skills)
    document_text = f"Role: {jd_data.job_title}. Required Skills: {skills_text}. Description: {jd_data.description_summary}"
    
    _, jd_col = get_chroma_collections()
    if jd_col:
        try:
            jd_col.add(
                documents=[document_text],
                metadatas=[{"job_title": jd_data.job_title}],
                ids=[jd_id]
            )
            return
        except Exception as e:
            print(f"[VectorService] ChromaDB store_jd error: {e}")
            
    _in_memory_jds[jd_id] = {
        "document": document_text,
        "metadata": {"job_title": jd_data.job_title, "skills": jd_data.mandatory_skills},
        "id": jd_id
    }

def query_matching_jds(resume_summary: str, n_results: int = 5):
    """Query ChromaDB for similar Job Descriptions"""
    _, jd_col = get_chroma_collections()
    if jd_col:
        try:
            results = jd_col.query(
                query_texts=[resume_summary],
                n_results=n_results
            )
            return results
        except Exception as e:
            print(f"[VectorService] query_matching_jds error: {e}")
            
    # In-memory fallback
    matches = list(_in_memory_jds.values())[:n_results]
    return {
        "ids": [[m["id"] for m in matches]],
        "documents": [[m["document"] for m in matches]],
        "metadatas": [[m["metadata"] for m in matches]],
    }

def query_matching_resumes(jd_summary: str, n_results: int = 5):
    """Query ChromaDB for similar Resumes"""
    resume_col, _ = get_chroma_collections()
    if resume_col:
        try:
            results = resume_col.query(
                query_texts=[jd_summary],
                n_results=n_results
            )
            return results
        except Exception as e:
            print(f"[VectorService] query_matching_resumes error: {e}")
            
    # In-memory fallback
    matches = list(_in_memory_resumes.values())[:n_results]
    return {
        "ids": [[m["id"] for m in matches]],
        "documents": [[m["document"] for m in matches]],
        "metadatas": [[m["metadata"] for m in matches]],
    }
