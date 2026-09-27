# Sprint 1 Implementation Plan: Production Multi-Tenancy, Database Persistence & Hardened RBAC

> **Sprint Reference:** Milestone 1 (Sprint 1) from [SkillSetu_AI_SaaS_Architectural_Audit.pdf](file:///d:/AI-Skill/SkillSetu_AI_SaaS_Architectural_Audit.pdf)  
> **Git Feature Branch:** `feat/sprint-1-database-persistence-and-hardened-rbac`  
> **Target Goal:** Transition SkillSetu AI from hackathon simulation mocks to a secure, persistent, and horizontally scalable SaaS foundation with relational database persistence, Alembic migrations, cryptographic JWT client handling, and strict FastAPI RBAC.

---

## 1. Executive Context & Architectural Audit Findings

According to the **Full-Stack & SaaS Product Architectural Audit** (`SkillSetu_AI_SaaS_Architectural_Audit.pdf`), the codebase possesses an exceptional frontend (9.5/10) and robust domain grading logic, but contains critical architectural vulnerabilities and demo shortcuts that must be resolved to commercialize the platform:

1. **Gap Sprint In-Memory Persistence (Audit §4.5)**:
   - `backend/app/api/v1/sprints.py` stores all sprint dispatches in `_DISPATCHED_SPRINTS: Dict[str, Dict[str, Any]] = {}`.
   - *Impact:* Sprints, candidate tokens, and URLs are wiped on process restart or across multi-worker deployments.
   - *Target Fix:* Real relational persistence in `dispatched_sprints` and `verified_credentials` tables.

2. **Client-Side Auth Bypass & Omitted API Bearer Tokens (Audit §4.6)**:
   - `frontend/src/app/login/page.tsx` executes `login(role, email)` in a `finally` block even when backend authentication fails.
   - `frontend/src/lib/api/client.ts` never attaches `Authorization: Bearer <token>` to outgoing requests.
   - Backend endpoints lack server-side role validation (`require_role(...)`), leaving them open to arbitrary unauthenticated mutation.
   - *Target Fix:* Update `client.ts` to automatically attach JWT Bearer tokens from storage, eliminate the client-side login bypass, and enforce strict role checks in FastAPI endpoints.

3. **Database Architecture & Multi-Tenancy (Audit §6 Milestone 1)**:
   - Move from single-file raw SQLite connection scripts to modern SQLAlchemy 2.0 with Alembic version-controlled migrations.
   - Implement relational models for `organizations`, `organization_memberships`, `subscriptions`, `dispatched_sprints`, and `verified_credentials`.

---

## 2. "Making It Better" SaaS Engineering Decisions

To deliver an enterprise-grade solution that exceeds standard hackathon refactoring:

1. **Dual-Engine Architecture (PostgreSQL Ready + SQLite Local Dev Zero-Friction)**:
   - The SQLAlchemy 2.0 session factory dynamically connects to `DATABASE_URL` (e.g. Supabase, Neon, AWS RDS in production).
   - If `DATABASE_URL` is omitted, it defaults to a local SQLite database (`sqlite:///app/db/skillsetu.db`) with `PRAGMA foreign_keys=ON;` and thread safety configured.
   - *Benefit:* Full cloud PostgreSQL readiness without breaking local developer velocity or automated CI runs.

2. **Declarative SQLAlchemy 2.0 Typing (`Mapped` & `mapped_column`)**:
   - Modern type-safe model definitions avoiding legacy SQLAlchemy 1.x patterns.
   - Comprehensive indices on foreign keys (`user_id`, `org_id`, `skill_id`, `credential_hash`).

3. **Backward-Compatible Seeding & Migration**:
   - Maintain seamless compatibility for the existing 55 passing pytest test cases.
   - Seed default tenant organizations (`Acme HyperScale Systems`, `Apex National Institute of Technology`, `TalentBridge Staffing Partners`) and demo users with verified bcrypt hashes.

4. **Resilient HTTP Client Interceptor (`client.ts`)**:
   - Automatic `Authorization: Bearer <token>` injection for all requests.
   - Centralized handling of `401 Unauthorized` (triggers session expiry notification).
   - Helper methods (`get`, `post`, `put`, `delete`) with deterministic timeout protection.

---

## 3. Professional Git Commit Breakdown (Atomic & Bisectable)

To provide clear traceability and effortless rollback capability, Sprint 1 is structured into **9 granular, atomic commits** following the Conventional Commits specification:

| # | Commit Message | Scope & Purpose | Files Touched |
|---|----------------|-----------------|---------------|
| **1** | `chore(deps): declare sqlalchemy, alembic, and psycopg2 in requirements` | Lock backend dependencies for relational persistence | `backend/requirements.txt` |
| **2** | `feat(db): implement sqlalchemy 2.0 session engine with postgres/sqlite support` | Create engine factory, connection pools, and `get_db` FastAPI dependency | `backend/app/db/session.py`, `backend/app/core/config.py` |
| **3** | `feat(db): define relational models for organizations, memberships, sprints, and credentials` | SQLAlchemy models for multi-tenancy, sprints, and credentials | `backend/app/models/entities.py`, `backend/app/db/base.py` |
| **4** | `feat(migrations): initialize alembic environment and generate baseline schema` | Alembic `env.py`, configuration, and initial revision script | `backend/alembic.ini`, `backend/alembic/*` |
| **5** | `feat(sprints): replace in-memory dictionary with relational db persistence` | Migrate `/sprints/dispatch`, `/active`, and `/complete` to DB operations | `backend/app/api/v1/sprints.py` |
| **6** | `feat(auth): harden fastapi rbac dependencies and enforce role checks on routers` | Enhance `get_current_user` and wire `require_role` to protected endpoints | `backend/app/api/deps.py`, `backend/app/api/v1/*.py` |
| **7** | `feat(client): implement automatic bearer token injection and error handling in http client` | Update `client.ts` to attach JWT headers and handle 401s | `frontend/src/lib/api/client.ts` |
| **8** | `fix(auth): eliminate login finally bypass and synchronize token with store` | Fix `login/page.tsx` error flow, token persistence, and role guards | `frontend/src/app/login/page.tsx`, `frontend/src/lib/store.tsx` |
| **9** | `test(sprint1): add integration test suite verifying rbac, token validation, and sprint db persistence` | Full automated regression test suite covering all Sprint 1 requirements | `backend/test_sprint1_rbac_and_persistence.py` |

---

## 4. Detailed Task-by-Task Implementation Plan

### Task 1: Lock Dependencies in `backend/requirements.txt`
- **Files:** `backend/requirements.txt`
- **Action:** Add `sqlalchemy>=2.0.30`, `alembic>=1.13.0`, `psycopg2-binary>=2.9.9` to `requirements.txt`.
- **Verification:** Run `python -c "import sqlalchemy, alembic, psycopg2; print('OK')"`
- **Commit:** `chore(deps): declare sqlalchemy, alembic, and psycopg2 in requirements`

### Task 2: Implement SQLAlchemy 2.0 Engine & Session Management
- **Files:** `backend/app/db/session.py`, `backend/app/core/config.py`
- **Action:**
  - In `config.py`, add `DATABASE_URL: Optional[str] = None`.
  - In `session.py`, create `engine` supporting PostgreSQL (with pool configuration) and SQLite (with `check_same_thread=False` and `PRAGMA foreign_keys=ON`).
  - Implement `get_db()` generator dependency yielding `Session`.
- **Verification:** Write unit check verifying engine initialization and session rollback.
- **Commit:** `feat(db): implement sqlalchemy 2.0 session engine with postgres/sqlite support`

### Task 3: Define Relational Models for Multi-Tenancy & Persistence
- **Files:** `backend/app/models/entities.py`, `backend/app/db/base.py`
- **Action:**
  - Create SQLAlchemy 2.0 models using `DeclarativeBase`:
    - `Organization`: tenant organizations (Acme, Apex, TalentBridge) with seat counts and status.
    - `User`: multi-role users with bcrypt `password_hash`, `role`, `org_id`, `readiness_score`, `verified_skills_json`.
    - `OrganizationMembership`: user-to-org scoping with role.
    - `Subscription`: SaaS plan details and statuses.
    - `DispatchedSprint`: replaces `_DISPATCHED_SPRINTS`, records candidate challenge invites.
    - `VerifiedCredential`: stores minted SHA-256 micro-credentials and canonical payloads.
- **Verification:** Verify model reflection and table creation via Python script.
- **Commit:** `feat(db): define relational models for organizations, memberships, sprints, and credentials`

### Task 4: Setup Alembic Migrations & Baseline Revision
- **Files:** `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/versions/001_initial_multitenant_schema.py`
- **Action:**
  - Configure `alembic/env.py` to import `Base.metadata` and bind engine dynamically.
  - Generate baseline revision creating all core tables.
- **Verification:** Run `alembic upgrade head` on test database and confirm tables exist.
- **Commit:** `feat(migrations): initialize alembic environment and generate baseline schema`

### Task 5: Migrate Sprints from In-Memory Dict to Relational DB
- **Files:** `backend/app/api/v1/sprints.py`
- **Action:**
  - Eliminate `_DISPATCHED_SPRINTS = {}`.
  - Update `POST /sprints/dispatch` to insert a `DispatchedSprint` row via `db: Session = Depends(get_db)`.
  - Update `GET /sprints/active` to query `DispatchedSprint` where status is `'dispatched'` or `'pending'`.
  - Update `POST /sprints/complete` to update `DispatchedSprint`, insert `VerifiedCredential`, and boost candidate score and verified skills in the database.
- **Verification:** Run `pytest test_sprints_suite.py` and verify all tests pass against the database.
- **Commit:** `feat(sprints): replace in-memory dictionary with relational db persistence`

### Task 6: Harden FastAPI RBAC & Wire Role Verification
- **Files:** `backend/app/api/deps.py`, `backend/app/api/v1/sprints.py`, `backend/app/api/v1/jobs.py`
- **Action:**
  - In `deps.py`, update `get_current_user` to query the database, validate JWT expiration, and support optional auth for public fallback when needed.
  - Wire `require_role(["employer", "admin"])` to `/sprints/dispatch`.
  - Wire `require_role(["student", "employer", "admin"])` to `/sprints/complete`.
  - Wire `require_role(["employer", "admin"])` to job creation/deletion in `/jobs`.
- **Verification:** Test unauthenticated access returns 401/403, and valid tokens with proper roles succeed.
- **Commit:** `feat(auth): harden fastapi rbac dependencies and enforce role checks on routers`

### Task 7: Update Frontend HTTP Client (`client.ts`) with Bearer Token Injection
- **Files:** `frontend/src/lib/api/client.ts`
- **Action:**
  - Read `skillsetu_jwt_token` from `localStorage` in browser environments and inject `Authorization: Bearer <token>`.
  - Export structured helper methods: `apiClient.get()`, `apiClient.post()`, `apiClient.put()`, `apiClient.delete()`.
  - Intercept 401 responses and dispatch token expiration events.
- **Verification:** Run `npm run lint` and verify TypeScript compilation.
- **Commit:** `feat(client): implement automatic bearer token injection and error handling in http client`

### Task 8: Eliminate Client-Side Login Bypass in `login/page.tsx` & Store
- **Files:** `frontend/src/app/login/page.tsx`, `frontend/src/lib/store.tsx`
- **Action:**
  - Remove `login(r, em, targetOrg)` from the `finally` block in `login/page.tsx`.
  - Only execute `login(...)` when the backend returns status 200 with a valid `access_token`.
  - Display explicit error notifications if credentials fail.
  - Add an explicit "Demo Offline Mode" option if backend is unreachable, ensuring transparent state rather than a silent security bypass.
  - Ensure `store.tsx` updates `skillsetu_jwt_token` in `localStorage` on login and purges on logout.
- **Verification:** Run `npm run lint` and test login validation flow.
- **Commit:** `fix(auth): eliminate login finally bypass and synchronize token with store`

### Task 9: Full Automated Test Suite & Verification
- **Files:** `backend/test_sprint1_rbac_and_persistence.py`
- **Action:**
  - Test 1: Sprints DB persistence (dispatch persists in DB, survives process state reset).
  - Test 2: Sprint completion creates `VerifiedCredential` and updates candidate verified skills in DB.
  - Test 3: Unauthenticated request to `/sprints/dispatch` returns 401.
  - Test 4: Student role attempting to dispatch sprint returns 403 Forbidden.
  - Test 5: Employer/Admin role successfully dispatches sprint.
  - Test 6: Verify all 55 existing regression tests pass.
- **Verification:** Run `pytest` across entire backend test suite.
- **Commit:** `test(sprint1): add integration test suite verifying rbac, token validation, and sprint db persistence`

---

## 5. Rollback & Bisect Strategy

By maintaining atomic commits with precise scopes:
- If a database migration issue occurs: `git revert <commit-4-hash>` or `git revert <commit-3-hash>` cleanly isolates schema changes.
- If an endpoint requires temporary public access during demos: `git revert <commit-6-hash>` rolls back RBAC enforcement without affecting database persistence.
- If frontend token storage requires adjustment: `git revert <commit-7-hash>` or `<commit-8-hash>` isolates client changes.
