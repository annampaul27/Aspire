# Sprint 2 Implementation Plan: Real Containerized & Isolated Code Execution Sandbox

> **For Claude / Agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate regex and string-matching heuristics in `backend/app/api/v1/sandbox.py` by engineering an authentic, isolated multi-tier execution sandbox. This includes an AST security sanitizer blocking dangerous syscalls/imports, an ephemeral in-memory database performance runner with 50,000 synthetic records and authentic `EXPLAIN QUERY PLAN` verification, an isolated Python subprocess runner with strict wall-clock timeouts (3.0s), a pluggable cloud Judge0/Docker adapter interface, and integration with the frontend `DynamicSandboxModal`.

**Architecture:** 
1. **Static Analysis Layer (`AstSecurityAnalyzer`)**: Walks the Python AST tree before execution, blocking blacklisted modules (`os`, `sys`, `subprocess`, `shutil`, `socket`, `pty`) and dangerous builtins (`eval`, `exec`, `open`, `__import__`).
2. **Ephemeral Database Performance Runner (`EphemeralDatabaseRunner`)**: Creates an in-memory relational database populated with 50,000 synthetic records; captures baseline sequential scan (`SCAN users`); applies candidate DDL (`CREATE INDEX ...`); verifies planner transition to `SEARCH users USING INDEX`; and measures authentic microsecond latency reduction.
3. **Isolated Subprocess Runner (`IsolatedPythonRunner`)**: Executes candidate logic in a separate sandboxed Python process with strict 3.0s wall-clock timeout, isolating memory and CPU, catching infinite loops, and executing test assertions.
4. **Cloud Runner Abstraction & Factory (`Judge0SandboxRunner` & `SandboxRunnerFactory`)**: Dispatches challenges to the appropriate runner and provides cloud container readiness via Judge0 API specifications.
5. **API Contract & Telemetry (`sandbox.py` & `DynamicSandboxModal.tsx`)**: Exposes both `/api/v1/sandbox/evaluate-bug` and `/api/v1/sandbox/run-tests` with true execution metrics, query plans, and cryptographic SHA-256 proof generation.

**Tech Stack:** Python 3.11, FastAPI, Python `ast`, SQLite/PostgreSQL `EXPLAIN QUERY PLAN`, `subprocess`, Pydantic V2, SHA-256, Next.js 16 / React 19, TypeScript.

---

## Sprint 2 Commit Roadmap (8 Granular Atomic Commits)

| # | Commit Message | Scope & Purpose | Target Files |
|---|----------------|-----------------|--------------|
| **1** | `feat(sandbox): create abstract execution runner interface and execution models` | Domain models and abstract base class for execution runners | `backend/app/services/sandbox/__init__.py`<br>`backend/app/services/sandbox/schemas.py`<br>`backend/app/services/sandbox/base.py` |
| **2** | `feat(sandbox): implement ast security analyzer blocking dangerous imports and syscalls` | Static AST security filter blocking forbidden modules and builtins | `backend/app/services/sandbox/security.py`<br>`backend/test_sandbox_security.py` |
| **3** | `feat(sandbox): implement isolated python subprocess runner with strict execution timeout` | Isolated worker execution harness with 3.0s timeout and output capture | `backend/app/services/sandbox/python_runner.py`<br>`backend/test_sandbox_python_runner.py` |
| **4** | `feat(sandbox): implement ephemeral database performance sandbox with 50k rows and explain query plan analyzer` | In-memory 50k row benchmark running real `EXPLAIN QUERY PLAN` | `backend/app/services/sandbox/database_runner.py`<br>`backend/test_sandbox_database_runner.py` |
| **5** | `feat(sandbox): implement cloud judge0 and container runner abstraction` | Factory pattern and remote Judge0/Docker container interface | `backend/app/services/sandbox/judge0_runner.py`<br>`backend/app/services/sandbox/factory.py` |
| **6** | `refactor(sandbox): replace regex heuristics in sandbox api with real execution engine and add run-tests endpoint` | Replace regex mocks with real execution; add `/run-tests` endpoint | `backend/app/api/v1/sandbox.py` |
| **7** | `feat(frontend): enhance dynamic sandbox modal with real-time execution plan output and error telemetry` | Display authentic query plans, latency deltas, and AST security feedback | `frontend/src/components/student/DynamicSandboxModal.tsx` |
| **8** | `test(sandbox): create comprehensive integration test suite for sprint 2 execution sandbox` | Verify end-to-end sandbox execution, security rejection, and backwards compatibility | `backend/test_sandbox_suite.py` |

---

## Detailed Task Breakdown

### Task 1: Execution Runner Interface & Pydantic Domain Schemas

**Files:**
- Create: `backend/app/services/sandbox/__init__.py`
- Create: `backend/app/services/sandbox/schemas.py`
- Create: `backend/app/services/sandbox/base.py`

**Step 1: Write schemas and base runner interface**
- Define `ExecutionStatus` enum (`SUCCESS`, `FAILED`, `SECURITY_VIOLATION`, `TIMEOUT`, `SYNTAX_ERROR`).
- Define `ExecutionTestCase` model (`name`, `status`, `latency_metric`, `details`, `query_plan`).
- Define `ExecutionRequest` model (`challenge_id`, `candidate_code`, `language`, `context`).
- Define `ExecutionResult` model (`is_solved`, `test_cases`, `execution_time_ms`, `stdout`, `stderr`, `cryptographic_hash`, `error_message`).
- Define abstract base class `BaseSandboxRunner` with abstract method:
  `async def run(self, request: ExecutionRequest) -> ExecutionResult: ...`

**Step 2: Verify imports and instantiation**
Run: `python -c "from app.services.sandbox.schemas import ExecutionResult; print('Schemas OK')"`
Expected: `Schemas OK`

**Step 3: Commit**
`git add backend/app/services/sandbox/`
`git commit -m "feat(sandbox): create abstract execution runner interface and execution models"`

---

### Task 2: AST Security Analyzer (Static Code Sanitizer)

**Files:**
- Create: `backend/app/services/sandbox/security.py`
- Create: `backend/test_sandbox_security.py`

**Step 1: Write failing security tests**
- Test blocking `import os`, `import sys`, `import subprocess`, `import shutil`, `import socket`.
- Test blocking `from os import system`, `from subprocess import Popen`.
- Test blocking calls to `eval()`, `exec()`, `open()`, `__import__()`.
- Test blocking dunder introspection `obj.__subclasses__()`, `obj.__globals__`.
- Test permitting safe code: `import asyncio`, `import math`, `from fastapi import FastAPI`, `CREATE INDEX ...`.

**Step 2: Run test to verify it fails**
Run: `pytest test_sandbox_security.py -v`
Expected: FAIL (ModuleNotFoundError / AstSecurityAnalyzer not implemented)

**Step 3: Implement `AstSecurityAnalyzer`**
- Use `ast.parse(code)`.
- Custom `ast.NodeVisitor` checking `Import`, `ImportFrom`, `Call`, `Attribute`.
- Returns `(is_safe: bool, violation_message: Optional[str])`.
- Handle syntax errors gracefully without raising uncaught exceptions.

**Step 4: Run test to verify it passes**
Run: `pytest test_sandbox_security.py -v`
Expected: All tests PASS.

**Step 5: Commit**
`git add backend/app/services/sandbox/security.py backend/test_sandbox_security.py`
`git commit -m "feat(sandbox): implement ast security analyzer blocking dangerous imports and syscalls"`

---

### Task 3: Isolated Python Subprocess Runner with Strict Wall-Clock Timeout

**Files:**
- Create: `backend/app/services/sandbox/python_runner.py`
- Create: `backend/test_sandbox_python_runner.py`

**Step 1: Write failing Python runner tests**
- Test valid Python execution (e.g. async handler resolution returning valid JSON).
- Test execution timeout: code with `while True: pass` or `time.sleep(10)` must terminate within 3.0 seconds with status `TIMEOUT`.
- Test security blocking integration: submitting `import os; os.system('echo hacked')` fails immediately with `SECURITY_VIOLATION`.
- Test syntax error handling: broken Python syntax returns `SYNTAX_ERROR` with line number.

**Step 2: Run test to verify it fails**
Run: `pytest test_sandbox_python_runner.py -v`
Expected: FAIL

**Step 3: Implement `IsolatedPythonRunner`**
- Subclass `BaseSandboxRunner`.
- First run `AstSecurityAnalyzer.validate(code)`. If invalid, return early with `SECURITY_VIOLATION`.
- Write code wrapped in lightweight test assertion scaffold into a temporary file.
- Launch via `subprocess.run([sys.executable, temp_file], capture_output=True, text=True, timeout=3.0)`.
- Measure elapsed time using `time.perf_counter_ns()`.
- Parse stdout/stderr and populate `ExecutionResult` with structured `ExecutionTestCase` entries.

**Step 4: Run test to verify it passes**
Run: `pytest test_sandbox_python_runner.py -v`
Expected: All tests PASS.

**Step 5: Commit**
`git add backend/app/services/sandbox/python_runner.py backend/test_sandbox_python_runner.py`
`git commit -m "feat(sandbox): implement isolated python subprocess runner with strict execution timeout"`

---

### Task 4: Ephemeral Database Performance Sandbox with 50,000 Rows & EXPLAIN QUERY PLAN

**Files:**
- Create: `backend/app/services/sandbox/database_runner.py`
- Create: `backend/test_sandbox_database_runner.py`

**Step 1: Write failing database runner tests**
- Test creating valid index `CREATE INDEX idx_users_email ON users(email);` converts `SCAN users` to `SEARCH users USING INDEX idx_users_email`.
- Test latency drop: verify index scan execution latency is significantly lower than full table scan on 50,000 synthetic rows.
- Test missing index or irrelevant DDL (e.g. `CREATE INDEX idx_other ON users(role);` when query filters on `email`) fails assertion with `FAIL: Query still executes full table scan`.
- Test SQL syntax error: broken SQL statement returns informative error message.

**Step 2: Run test to verify it fails**
Run: `pytest test_sandbox_database_runner.py -v`
Expected: FAIL

**Step 3: Implement `EphemeralDatabaseRunner`**
- Subclass `BaseSandboxRunner`.
- Maintain an ephemeral in-memory SQLite database instance populated with 50,000 deterministic synthetic records.
- Run baseline `EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = 'test_user_42000@example.com';` -> confirms `SCAN users`.
- Apply candidate SQL statement.
- Run `EXPLAIN QUERY PLAN` again -> check for `SEARCH users USING INDEX ...`.
- Measure latency before vs after over multiple iterations.
- Build detailed `ExecutionResult` containing:
  - Test 1: DDL Syntax & Execution Sanity (`PASS`)
  - Test 2: Execution Plan Verification (`PASS` with plan text, e.g., `SEARCH users USING INDEX idx_users_email`)
  - Test 3: Microsecond Latency Reduction (`PASS` with metric, e.g., `8.4ms -> 0.04ms (-99.5%)`)

**Step 4: Run test to verify it passes**
Run: `pytest test_sandbox_database_runner.py -v`
Expected: All tests PASS.

**Step 5: Commit**
`git add backend/app/services/sandbox/database_runner.py backend/test_sandbox_database_runner.py`
`git commit -m "feat(sandbox): implement ephemeral database performance sandbox with 50k rows and explain query plan analyzer"`

---

### Task 5: Cloud Judge0 & Container Runner Abstraction + Factory Pattern

**Files:**
- Create: `backend/app/services/sandbox/judge0_runner.py`
- Create: `backend/app/services/sandbox/factory.py`

**Step 1: Write tests for runner factory**
- `SandboxRunnerFactory.get_runner("db-perf-01")` returns `EphemeralDatabaseRunner`.
- `SandboxRunnerFactory.get_runner("async-lock-01")` returns `IsolatedPythonRunner`.
- When `JUDGE0_API_URL` is set, factory can route containerized challenges to `Judge0SandboxRunner`.

**Step 2: Implement `Judge0SandboxRunner` & `SandboxRunnerFactory`**
- Implement `Judge0SandboxRunner` handling remote containerized execution payloads.
- Implement `SandboxRunnerFactory` with intelligent routing based on `challenge_id` or explicit language tag.

**Step 3: Verify runner routing**
Run: `python -c "from app.services.sandbox.factory import SandboxRunnerFactory; print(SandboxRunnerFactory.get_runner('db-perf-01'))"`
Expected: Displays `EphemeralDatabaseRunner` instance.

**Step 4: Commit**
`git add backend/app/services/sandbox/judge0_runner.py backend/app/services/sandbox/factory.py`
`git commit -m "feat(sandbox): implement cloud judge0 and container runner abstraction"`

---

### Task 5.5 / Task 6: Refactor Sandbox API with Real Execution Engine & Implement `/run-tests`

**Files:**
- Modify: `backend/app/api/v1/sandbox.py`

**Step 1: Replace regex heuristics with real sandbox execution**
- Remove:
  ```python
  if "create index" in code_lower and ("on " in code_lower or "users" in code_lower):
      is_solved = True
  elif len(code_clean) > 25 ...:
  ```
- Delegate execution directly to `SandboxRunnerFactory.get_runner(data.challenge_id).run(...)`.
- Add endpoint `@router.post("/sandbox/run-tests")` accepting:
  ```python
  class RunTestsRequest(BaseModel):
      challenge_id: str
      code_submission: str
      user_id: Optional[str] = None
  ```
  and returning `{ is_solved, test_cases, crypto_hash, execution_time_ms, query_plan }`.
- Ensure `/api/v1/sandbox/evaluate-bug` and `/api/evaluate-bug` use the real execution engine and return `BugFixResponse`.
- Generate tamper-proof SHA-256 cryptographic proof token incorporating real test execution result digest.

**Step 2: Run test suite to verify endpoints**
Run: `pytest test_sandbox_suite.py -v`
Expected: All 5 tests PASS with authentic execution.

**Step 3: Commit**
`git add backend/app/api/v1/sandbox.py`
`git commit -m "refactor(sandbox): replace regex heuristics in sandbox api with real execution engine and add run-tests endpoint"`

---

### Task 7: Enhance Dynamic Sandbox Modal UI with Real-Time Query Plan & Telemetry

**Files:**
- Modify: `frontend/src/components/student/DynamicSandboxModal.tsx`

**Step 1: Update API call and response handling**
- Verify the modal calls `/api/v1/sandbox/run-tests` with proper payload.
- Add rendering for `query_plan` and execution telemetry.
- Add security warning callout if status is `SECURITY_VIOLATION`.
- Render latency reduction comparisons (`Baseline: 1,420ms -> Optimized: 0.12ms`).

**Step 2: Test frontend build and lint**
Run: `npm run lint` in `frontend/`
Expected: 0 errors, 0 warnings.

**Step 3: Commit**
`git add frontend/src/components/student/DynamicSandboxModal.tsx`
`git commit -m "feat(frontend): enhance dynamic sandbox modal with real-time execution plan output and error telemetry"`

---

### Task 8: Comprehensive End-to-End Test Suite & Verification

**Files:**
- Modify: `backend/test_sandbox_suite.py`

**Step 1: Add comprehensive integration tests**
- Test true SQL index execution on 50,000 rows.
- Test spoofed string rejection: candidate code that contains `"create index"` inside a comment or print statement without executing real DDL fails.
- Test security injection blocking: candidate code attempting `import os; os.system(...)` is rejected with security alert.
- Test infinite loop timeout: candidate code with `while True:` times out cleanly without hanging server.
- Test both `/api/v1/sandbox/evaluate-bug` and `/api/v1/sandbox/run-tests`.

**Step 2: Run all backend tests**
Run: `pytest backend/ -v`
Expected: 100% pass across all test suites with 0 regressions.

**Step 3: Commit**
`git add backend/test_sandbox_suite.py`
`git commit -m "test(sandbox): create comprehensive integration test suite for sprint 2 execution sandbox"`

---

## Safety, Rollback & Presentation Guarantee

1. **Presentation Readiness**: All existing demo flows (`/demo`, `/student`, `/admin`) remain 100% functional.
2. **Deterministic Fallbacks**: If external LLM or Groq APIs are offline or rate-limited, local AST and ephemeral database runners execute seamlessly within milliseconds.
3. **Bisectable History**: Every commit compiles, passes tests, and can be checked out independently without breaking the application.
