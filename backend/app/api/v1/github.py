"""
GitHub Analysis & Security Audit Endpoints (FastAPI)
Author: Career-OS Security & GitHub Engineering
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from features.github_analysis import github_service
from app.models.github import RemediationRequest, ScanRequest

router = APIRouter()


@router.get("/repos", summary="Fetch student public GitHub repositories")
async def get_repos(username: Optional[str] = Query(None, description="GitHub username or handle")):
    try:
        repos = await github_service.get_all_repos(username_override=username)
        return repos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scan", summary="Scan repository for leaked secrets and health score")
async def scan_repo(req: ScanRequest):
    try:
        scan_result = await github_service.scan_for_secrets(req.repo_full_name)
        return scan_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remediate", summary="1-Click Security Remediation (add .gitignore or remove .env)")
async def remediate_repo(req: RemediationRequest):
    try:
        result = await github_service.remediate_repo(req.repo_full_name, req.action)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/inspect", summary="Deep Code & Architecture Inspection")
async def inspect_repo(repo_full_name: str = Query(..., description="Full repo name owner/repo")):
    try:
        inspection = await github_service.inspect_repo_code(repo_full_name)
        return inspection
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/readme", summary="Fetch README decoded content")
async def get_readme(repo_full_name: str = Query(..., description="Full repo name owner/repo")):
    try:
        return await github_service.get_readme(repo_full_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
