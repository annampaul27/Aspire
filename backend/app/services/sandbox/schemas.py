from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ExecutionStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    SECURITY_VIOLATION = "SECURITY_VIOLATION"
    TIMEOUT = "TIMEOUT"
    SYNTAX_ERROR = "SYNTAX_ERROR"


class ExecutionTestCase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(default="Test Case", alias="test_name", description="Identifier or name of the test assertion")
    status: str = Field(default="PASS", description="PASS or FAIL")
    latency_metric: Optional[str] = Field(default="N/A", description="Latency or performance metric")
    details: Optional[str] = Field(default="", description="Diagnostic details or explanation")
    query_plan: Optional[str] = Field(default=None, description="EXPLAIN QUERY PLAN or AST inspection output")


class ExecutionRequest(BaseModel):
    challenge_id: str = Field(description="Unique challenge key, e.g. db-perf-01 or async-lock-01")
    candidate_code: str = Field(description="Submitted candidate code or DDL")
    language: Optional[str] = Field(default="python", description="Language environment: python, sql, etc.")
    user_id: Optional[str] = Field(default=None, description="Optional submitting candidate ID")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Custom parameters or test fixtures")


class ExecutionResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    is_solved: bool = Field(default=False, description="True if all assertions and performance bars are passed")
    status: ExecutionStatus = Field(default=ExecutionStatus.FAILED, description="High-level execution status code")
    test_cases: List[ExecutionTestCase] = Field(default_factory=list, description="Array of executed test assertions")
    execution_time_ms: float = Field(default=0.0, description="Total wall-clock execution time in milliseconds")
    stdout: str = Field(default="", description="Captured standard output")
    stderr: str = Field(default="", description="Captured error output or traceback")
    query_plan: Optional[str] = Field(default=None, description="Detailed database EXPLAIN QUERY PLAN if applicable")
    cryptographic_hash: str = Field(default="INVALID_HASH_FIX_FAILED", description="SHA-256 tamper-proof proof token")
    error_message: Optional[str] = Field(default=None, description="Security or execution failure details")
