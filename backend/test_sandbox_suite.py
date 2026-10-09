import hashlib
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_generate_challenge_api_v1():
    """
    Test generating dynamic bug-fix challenge via /api/v1/sandbox/generate-challenge.
    """
    payload = {
        "skill_gap": "PostgreSQL indexing & query latency",
        "role": "Backend Engineer"
    }
    response = client.post("/api/v1/sandbox/generate-challenge", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "challenge_id" in data
    assert "title" in data
    assert "description" in data
    assert "starter_code" in data
    assert len(data["starter_code"]) > 0

def test_generate_challenge_root_alias():
    """
    Test generating dynamic bug-fix challenge via /api/generate-challenge (code-bug-fixer-engine compatibility).
    """
    payload = {
        "skill_gap": "Python Asyncio concurrency",
        "role": "Distributed Systems Engineer"
    }
    response = client.post("/api/generate-challenge", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "challenge_id" in data
    assert len(data["challenge_id"]) > 0
    assert "title" in data
    assert "starter_code" in data

def test_evaluate_bug_fix_success():
    """
    Test evaluating a valid bug fix code submission with passing tests and SHA-256 hash.
    """
    payload = {
        "challenge_id": "db-perf-01",
        "candidate_code": "CREATE INDEX idx_users_email ON users(email);"
    }
    response = client.post("/api/v1/sandbox/evaluate-bug", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_solved"] is True
    assert len(data["test_cases"]) >= 3
    for tc in data["test_cases"]:
        assert tc["status"] == "PASS"
        assert "latency_metric" in tc
    
    # Verify SHA-256 cryptographic proof
    assert "cryptographic_hash" in data
    assert len(data["cryptographic_hash"]) == 64
    assert data["cryptographic_hash"] != "INVALID_HASH_FIX_FAILED"

    # Verify deterministic hash calculation
    expected_seed = f"{payload['challenge_id']}:{payload['candidate_code']}:VERIFIED:2026"
    expected_hash = hashlib.sha256(expected_seed.encode()).hexdigest()
    assert data["cryptographic_hash"] == expected_hash

def test_evaluate_bug_fix_failure():
    """
    Test evaluating an incomplete bug fix submission with failing status and invalid hash.
    """
    payload = {
        "challenge_id": "db-perf-01",
        "candidate_code": "# TODO: fix this later\npass"
    }
    response = client.post("/api/evaluate-bug", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_solved"] is False
    assert data["cryptographic_hash"] == "INVALID_HASH_FIX_FAILED"
    assert any(tc["status"] == "FAIL" for tc in data["test_cases"])

def test_evaluate_async_bug_fix():
    """
    Test evaluating an async event-loop concurrency fix.
    """
    payload = {
        "challenge_id": "async-lock-01",
        "candidate_code": "import asyncio\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/metrics')\nasync def fetch_metrics():\n    await asyncio.sleep(0.01)\n    return {'status': 'ok'}"
    }
    response = client.post("/api/v1/sandbox/evaluate-bug", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_solved"] is True
    assert len(data["cryptographic_hash"]) == 64

def test_run_tests_endpoint_success():
    """
    Test frontend DynamicSandboxModal endpoint /api/v1/sandbox/run-tests.
    """
    payload = {
        "challenge_id": "db-perf-01",
        "code_submission": "CREATE INDEX idx_users_email ON users(email);",
        "user_id": "student-test-42"
    }
    response = client.post("/api/v1/sandbox/run-tests", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_solved"] is True
    assert data["crypto_hash"] != "INVALID_HASH_FIX_FAILED"
    assert len(data["test_cases"]) >= 3
    assert data["query_plan"] is not None
    assert "USING INDEX" in data["query_plan"]
    assert data["execution_time_ms"] > 0

def test_spoofed_comment_fails_in_real_sandbox():
    """
    Anti-cheating audit verification:
    Submitting a SQL comment containing 'create index on users' without actual DDL
    must fail under real database execution (previously passed under regex heuristics).
    """
    payload = {
        "challenge_id": "db-perf-01",
        "candidate_code": "-- CREATE INDEX idx_users_email ON users(email);\nSELECT 1;"
    }
    response = client.post("/api/v1/sandbox/evaluate-bug", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_solved"] is False
    assert data["cryptographic_hash"] == "INVALID_HASH_FIX_FAILED"

def test_security_injection_blocked_in_sandbox():
    """
    Security verification:
    Attempting to import os or execute system calls must be intercepted by the AST analyzer.
    """
    payload = {
        "challenge_id": "async-lock-01",
        "candidate_code": "import os\nos.system('echo pwned')\n"
    }
    response = client.post("/api/v1/sandbox/evaluate-bug", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_solved"] is False
    assert data["cryptographic_hash"] == "INVALID_HASH_FIX_FAILED"
    assert any("Forbidden import" in (tc["details"] or "") for tc in data["test_cases"])

def test_infinite_loop_timeout_in_sandbox():
    """
    Timeout verification:
    Submitting an infinite loop must not hang the server and must terminate with timeout status.
    """
    payload = {
        "challenge_id": "async-lock-01",
        "candidate_code": "while True:\n    pass\n"
    }
    response = client.post("/api/v1/sandbox/evaluate-bug", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_solved"] is False
    assert data["cryptographic_hash"] == "INVALID_HASH_FIX_FAILED"
