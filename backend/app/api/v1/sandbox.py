import hashlib
import os
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
from dotenv import load_dotenv
from app.core.config import settings

from app.services.sandbox import (
    SandboxRunnerFactory,
    ExecutionRequest,
    ExecutionResult,
)

load_dotenv()

router = APIRouter(tags=["Dynamic Code Bug-Fixer Engine"])


# Pydantic Schemas matching code-bug-fixer-engine & frontend DynamicSandboxModal
class BugFixRequest(BaseModel):
    challenge_id: str = Field(description="Unique identifier for the bug challenge")
    candidate_code: str = Field(description="The code snippet submitted by the developer")


class TestCaseResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    test_name: Optional[str] = Field(default="Test Case", alias="name", description="Name of the test case")
    status: str = Field(default="PASS", description="Must be 'PASS' or 'FAIL' or 'pass'")
    latency_metric: Optional[Any] = Field(default="N/A", description="Performance metric output")
    details: Optional[str] = Field(default="Passed successfully", description="Explanation of test result")


class BugFixResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    is_solved: bool = Field(description="True if all production criteria and tests pass successfully")
    test_cases: List[TestCaseResult] = Field(description="Detailed test case execution suite")
    cryptographic_hash: str = Field(description="SHA-256 proof-of-work security hash token")


class RunTestsRequest(BaseModel):
    challenge_id: str = Field(description="Unique challenge key, e.g. db-perf-01")
    code_submission: str = Field(description="Candidate submitted code or DDL")
    user_id: Optional[str] = Field(default=None, description="Current student user ID")


class RunTestsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    is_solved: bool = Field(description="True if all production test assertions pass")
    test_cases: List[TestCaseResult] = Field(description="Test case execution details")
    crypto_hash: str = Field(alias="cryptographic_hash", description="SHA-256 tamper-proof token")
    cryptographic_hash: str = Field(description="SHA-256 tamper-proof token")
    execution_time_ms: float = Field(default=0.0, description="Total execution time in milliseconds")
    query_plan: Optional[str] = Field(default=None, description="Authentic EXPLAIN QUERY PLAN output")
    error_message: Optional[str] = Field(default=None, description="Security violation or syntax error details")


class ChallengeRequest(BaseModel):
    skill_gap: str = Field(description="The specific missing skill to test, e.g., 'PostgreSQL indexing' or 'Python Asyncio'")
    role: str = Field(default="Backend Engineer", description="The target job role, e.g., 'Backend Engineer'")


class ChallengeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    challenge_id: Optional[str] = Field(default="db-perf-01", description="Unique identifier")
    title: Optional[str] = Field(default="Production PostgreSQL Slow Query Fix", description="Catchy title of the challenge")
    description: Optional[str] = Field(default="Fix the unindexed sequential scan in the given snippet.", description="Detailed scenario description")
    starter_code: Optional[str] = Field(default="# Broken code\nSELECT * FROM users WHERE email = 'test@example.com';", description="The broken starter code snippet")


# Deterministic challenge templates for high-speed fallback / NF2 compliance
CURATED_CHALLENGES = {
    "postgres": {
        "challenge_id": "db-perf-01",
        "title": "PostgreSQL Slow Query Optimization & Indexing",
        "description": "Production alert: The user lookup query `SELECT * FROM users WHERE email = $1;` is causing a Sequential Scan across 1.4 million rows with 1,420ms P99 latency. Write an optimized DDL index statement to achieve an Index Scan under 15ms.",
        "starter_code": "-- Current Slow Table Schema without Index\n-- Write an optimized CREATE INDEX statement to eliminate Seq Scan:\nCREATE INDEX idx_users_email ON users(email);",
        "solution_keywords": ["create index", "idx_", "on users", "email"],
    },
    "fastapi": {
        "challenge_id": "async-lock-01",
        "title": "FastAPI Async Event Loop Deadlock Resolution",
        "description": "Production alert: High concurrency worker threads are crashing due to a blocking `time.sleep()` call inside an `async def` route handler, causing event loop starvation. Refactor the snippet to use non-blocking asynchronous concurrency primitives.",
        "starter_code": "import time\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/metrics')\nasync def fetch_metrics():\n    # BUG: Blocking call locks uvloop\n    time.sleep(2)\n    return {'status': 'ok'}",
        "solution_keywords": ["asyncio.sleep", "await"],
    },
    "docker": {
        "challenge_id": "docker-sec-01",
        "title": "Docker Multi-Stage Build & Security Hardening",
        "description": "Production alert: The build artifact is 1.8GB and running as root. Refactor the Dockerfile to use a multi-stage Alpine build and drop privileges to a non-root user.",
        "starter_code": "FROM python:3.11\nWORKDIR /app\nCOPY . .\nRUN pip install -r requirements.txt\nCMD [\"python\", \"run.py\"]",
        "solution_keywords": ["user ", "alpine", "from python"],
    }
}


@router.post("/sandbox/generate-challenge", response_model=ChallengeResponse)
@router.post("/generate-challenge", response_model=ChallengeResponse)
async def generate_dynamic_challenge(data: ChallengeRequest):
    """
    Dynamically generates a custom engineering bug-fix challenge and starter code
    based on candidate skill gaps (via Groq LLM with deterministic fallback).
    """
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key:
        try:
            from groq import Groq
            import instructor

            client = instructor.from_groq(
                Groq(api_key=groq_api_key),
                mode=instructor.Mode.JSON,
            )

            prompt = f"""
            You are a principal software engineer and technical hiring manager. 
            Create a realistic, hands-on production bug-fix challenge for a candidate who has a skill gap in '{data.skill_gap}' for a '{data.role}' position.
            
            Instructions:
            1. Create a unique challenge_id (e.g., 'db-perf-02' or 'async-lock-01').
            2. Provide a professional title.
            3. Write a clear scenario description explaining a production problem (e.g., memory leak, unindexed query, race condition).
            4. Write a snippet of broken starter_code that contains the bug for the candidate to fix.
            """

            result = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                response_model=ChallengeResponse,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2048,
            )
            return result
        except Exception:
            pass

    # Deterministic Fallback based on skill_gap keywords
    skill_lower = data.skill_gap.lower()
    if "postgres" in skill_lower or "sql" in skill_lower or "database" in skill_lower:
        match = CURATED_CHALLENGES["postgres"]
    elif "async" in skill_lower or "fastapi" in skill_lower or "python" in skill_lower:
        match = CURATED_CHALLENGES["fastapi"]
    elif "docker" in skill_lower or "container" in skill_lower or "devops" in skill_lower:
        match = CURATED_CHALLENGES["docker"]
    else:
        match = {
            "challenge_id": f"challenge-{abs(hash(data.skill_gap)) % 1000:03d}",
            "title": f"Production {data.skill_gap.title()} Remediation Challenge",
            "description": f"A critical performance regression has been detected in the {data.skill_gap} pipeline for the {data.role} position. Fix the bug in the snippet below to pass automated test cases.",
            "starter_code": f"# Production starter code for {data.skill_gap}\n# TODO: Fix performance bottleneck and return valid output\ndef optimize_handler(payload):\n    pass\n"
        }

    return ChallengeResponse(
        challenge_id=match["challenge_id"],
        title=match["title"],
        description=match["description"],
        starter_code=match["starter_code"]
    )


async def _execute_sandbox_candidate(
    challenge_id: str,
    candidate_code: str,
    user_id: Optional[str] = None
) -> ExecutionResult:
    """
    Executes candidate submission in authentic isolated execution environment
    (ephemeral 50k-row database or isolated Python subprocess with AST sanitizer).
    """
    runner = SandboxRunnerFactory.get_runner(challenge_id)
    language = "sql" if ("db-" in challenge_id.lower() or "sql" in challenge_id.lower()) else "python"
    
    exec_req = ExecutionRequest(
        challenge_id=challenge_id,
        candidate_code=candidate_code,
        language=language,
        user_id=user_id,
    )
    return await runner.run(exec_req)


@router.post("/sandbox/evaluate-bug", response_model=BugFixResponse)
@router.post("/evaluate-bug", response_model=BugFixResponse)
async def evaluate_bug_fix(data: BugFixRequest):
    """
    Receives candidate code, evaluates under authentic isolated execution engines
    (AST security filter + ephemeral 50k-row DB / isolated subprocess runner),
    and generates a tamper-proof SHA-256 proof-of-work hash.
    """
    exec_res = await _execute_sandbox_candidate(
        challenge_id=data.challenge_id,
        candidate_code=data.candidate_code
    )

    test_cases = [
        TestCaseResult(
            name=tc.name,
            status=tc.status,
            latency_metric=tc.latency_metric,
            details=tc.details
        )
        for tc in exec_res.test_cases
    ]

    return BugFixResponse(
        is_solved=exec_res.is_solved,
        test_cases=test_cases,
        cryptographic_hash=exec_res.cryptographic_hash
    )


@router.post("/sandbox/run-tests", response_model=RunTestsResponse)
async def run_sandbox_tests(data: RunTestsRequest):
    """
    Direct endpoint for frontend DynamicSandboxModal test execution.
    Executes candidate code in isolated sandbox and returns real query plans,
    microsecond latency metrics, and AST security feedback.
    """
    exec_res = await _execute_sandbox_candidate(
        challenge_id=data.challenge_id,
        candidate_code=data.code_submission,
        user_id=data.user_id
    )

    test_cases = [
        TestCaseResult(
            name=tc.name,
            status=tc.status,
            latency_metric=tc.latency_metric,
            details=tc.details
        )
        for tc in exec_res.test_cases
    ]

    return RunTestsResponse(
        is_solved=exec_res.is_solved,
        test_cases=test_cases,
        crypto_hash=exec_res.cryptographic_hash,
        cryptographic_hash=exec_res.cryptographic_hash,
        execution_time_ms=exec_res.execution_time_ms,
        query_plan=exec_res.query_plan,
        error_message=exec_res.error_message
    )
