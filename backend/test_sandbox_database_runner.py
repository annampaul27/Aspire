import pytest
from app.services.sandbox.schemas import ExecutionRequest, ExecutionStatus
from app.services.sandbox.database_runner import EphemeralDatabaseRunner


@pytest.mark.asyncio
async def test_database_runner_valid_index_passes():
    runner = EphemeralDatabaseRunner(row_count=10000)
    candidate_sql = "CREATE INDEX idx_users_email ON users(email);"
    req = ExecutionRequest(
        challenge_id="db-perf-01",
        candidate_code=candidate_sql,
        language="sql"
    )
    result = await runner.run(req)
    assert result.is_solved is True
    assert result.status == ExecutionStatus.SUCCESS
    assert result.query_plan is not None
    assert "USING INDEX" in result.query_plan
    assert len(result.test_cases) == 3
    assert all(tc.status == "PASS" for tc in result.test_cases)
    assert result.cryptographic_hash != "INVALID_HASH_FIX_FAILED"


@pytest.mark.asyncio
async def test_database_runner_wrong_column_index_fails():
    runner = EphemeralDatabaseRunner(row_count=10000)
    # Creating index on 'status' instead of 'email' should not optimize email lookup
    candidate_sql = "CREATE INDEX idx_users_status ON users(status);"
    req = ExecutionRequest(
        challenge_id="db-perf-01",
        candidate_code=candidate_sql,
        language="sql"
    )
    result = await runner.run(req)
    assert result.is_solved is False
    assert result.status == ExecutionStatus.FAILED
    assert any(tc.status == "FAIL" for tc in result.test_cases)
    # The plan should still be SCAN
    assert "SCAN" in (result.query_plan or "")


@pytest.mark.asyncio
async def test_database_runner_syntax_error_fails():
    runner = EphemeralDatabaseRunner(row_count=1000)
    bad_sql = "CRATE INDX broken;"
    req = ExecutionRequest(
        challenge_id="db-perf-01",
        candidate_code=bad_sql,
        language="sql"
    )
    result = await runner.run(req)
    assert result.is_solved is False
    assert result.status in (ExecutionStatus.SYNTAX_ERROR, ExecutionStatus.FAILED)
    assert any(tc.status == "FAIL" for tc in result.test_cases)


@pytest.mark.asyncio
async def test_database_runner_spoofed_comment_fails():
    runner = EphemeralDatabaseRunner(row_count=1000)
    # Candidate tried to fool regex with a comment!
    spoofed_sql = "-- CREATE INDEX idx_users_email ON users(email);\nSELECT 1;"
    req = ExecutionRequest(
        challenge_id="db-perf-01",
        candidate_code=spoofed_sql,
        language="sql"
    )
    result = await runner.run(req)
    # Under real execution, this must fail because no actual index was created!
    assert result.is_solved is False
    assert result.status == ExecutionStatus.FAILED
