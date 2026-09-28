import pytest
from app.services.sandbox.schemas import ExecutionRequest, ExecutionStatus
from app.services.sandbox.python_runner import IsolatedPythonRunner


@pytest.mark.asyncio
async def test_python_runner_security_violation():
    runner = IsolatedPythonRunner()
    malicious_code = "import os\nos.system('echo pwned')"
    req = ExecutionRequest(
        challenge_id="async-lock-01",
        candidate_code=malicious_code,
        language="python"
    )
    result = await runner.run(req)
    assert result.is_solved is False
    assert result.status == ExecutionStatus.SECURITY_VIOLATION
    assert "Forbidden import" in (result.error_message or "")
    assert len(result.test_cases) > 0
    assert result.test_cases[0].status == "FAIL"


@pytest.mark.asyncio
async def test_python_runner_timeout():
    runner = IsolatedPythonRunner(timeout_seconds=1.5)
    infinite_loop_code = "while True:\n    pass"
    req = ExecutionRequest(
        challenge_id="challenge-test-timeout",
        candidate_code=infinite_loop_code,
        language="python"
    )
    result = await runner.run(req)
    assert result.is_solved is False
    assert result.status == ExecutionStatus.TIMEOUT
    assert "timed out" in (result.error_message or "").lower()


@pytest.mark.asyncio
async def test_python_runner_async_challenge_success():
    runner = IsolatedPythonRunner()
    valid_async_code = """
import asyncio
from fastapi import FastAPI

app = FastAPI()

@app.get('/metrics')
async def fetch_metrics():
    await asyncio.sleep(0.01)
    return {'status': 'ok'}
"""
    req = ExecutionRequest(
        challenge_id="async-lock-01",
        candidate_code=valid_async_code,
        language="python"
    )
    result = await runner.run(req)
    assert result.is_solved is True
    assert result.status == ExecutionStatus.SUCCESS
    assert len(result.test_cases) >= 3
    assert all(tc.status == "PASS" for tc in result.test_cases)
    assert len(result.cryptographic_hash) == 64
    assert result.cryptographic_hash != "INVALID_HASH_FIX_FAILED"


@pytest.mark.asyncio
async def test_python_runner_async_blocking_sleep_fails():
    runner = IsolatedPythonRunner(timeout_seconds=2.0)
    blocking_code = """
import time
from fastapi import FastAPI

app = FastAPI()

@app.get('/metrics')
async def fetch_metrics():
    time.sleep(0.5)
    return {'status': 'ok'}
"""
    req = ExecutionRequest(
        challenge_id="async-lock-01",
        candidate_code=blocking_code,
        language="python"
    )
    result = await runner.run(req)
    assert result.is_solved is False
    assert any(tc.status == "FAIL" for tc in result.test_cases)
