# Aspire AI — Role-Separated Talent Infrastructure & Trust Engine

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-red.svg?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![Alembic](https://img.shields.io/badge/Alembic-Migrations-orange.svg)](https://alembic.sqlalchemy.org)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-FF6B6B.svg)](https://trychroma.com)
[![Groq](https://img.shields.io/badge/Groq-Llama3_Extraction-F55036.svg)](https://groq.com)
[![Pytest](https://img.shields.io/badge/Pytest-142%20Passed-brightgreen.svg?logo=pytest&logoColor=white)](https://pytest.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Aspire AI bridges the gap between talent supply (students) and employer demand (corporates, universities, staffing agencies). It combines an AI-powered Applicant Tracking System (ATS), cryptographic proof-of-work credentialing (SHA-256), a dual-tier isolated execution sandbox with AST security filtering, and deterministic deficit-resistance skill matching.

---

## 👥 Contributors & Feature Attribution

| Contributor | GitHub | Role & Subsystems Engineered |
|---|---|---|
| **Nandana** | [@nandana-web520](https://github.com/nandana-web520) | **Feature Architect — Skill Verification & ATS Resume Studio**<br>• Designed & implemented the Skill Verification Engine (**FR-01**)<br>• 20-question, 12-minute timed assessment with automatic grading & multi-tier badge issuance (Bronze, Silver, Gold, Platinum)<br>• ATS-Friendly Tailored Resume Studio (**FR-02**) with AI spatial parsing and real-time schema editing<br>• SQLite persistence layer (`backend/app/db/database.py`) and FastAPI endpoints (`/api/v1/assessments`, `/api/v1/resume`) |
| **Jayasree A B** | [@JayasreeAB](https://github.com/JayasreeAB) | **Feature Architect — CareerCompass AI Modules & Course Curriculum**<br>• Designed & implemented the 8 CareerCompass feature modules (`backend/features/`)<br>• Dynamic Personalized Roadmap Generator mapping skill gaps to curriculum phases (`personalized_roadmap.py`)<br>• Designed & authored the 13 modular CareerCompass course curricula, structured lessons, and 20-question timed mock exams (`courses/`) across Python, SQL, AWS, LLM, Trees, Arrays, Django, Flask, Pandas, Javascript, HTML, CSS, Excel<br>• Fast dynamic course catalog and interactive mock testing engine (`backend/app/api/v1/courses.py`)<br>• Personalized 90-Day Career Roadmap generator (`career_roadmap.py`)<br>• AI GitHub repository project analyzer & complexity assessor (`github_analysis.py`)<br>• Dynamic mock interview coach & answer evaluation scoring (`interview_coach.py`)<br>• Real-time job market demand classifier (`job_market_analysis.py`)<br>• Automated personal developer portfolio website builder (`portfolio_builder.py`)<br>• Deep resume highlights, strengths & weakness extractor (`resume_analysis.py`)<br>• Multidimensional competency & skill gap analyzer (`skill_gap_analysis.py`) |
| **Anna M Paul** | [@annampaul27](https://github.com/annampaul27) | **Core Feature Architect — ATS & Dynamic Sandbox Engine**<br>• Designed & implemented the ATS FastAPI microservices (`/api/v1/ats/*`)<br>• Structured LLM parsing pipeline via Groq + Instructor (`ResumeSchema`, `JDSchema`)<br>• ChromaDB persistent vector repository & semantic applicant retrieval<br>• Deterministic skill gap comparison & tier segmentation (**E1, E2, E3, E4, E10**)<br>• Dynamic Code Bug-Fixer Engine & Challenge Generator (`code-bug-fixer-engine/`, `/api/v1/sandbox/*`)<br>• Real-time sandbox test runner with latency metrics & SHA-256 cryptographic proof-of-work minting |
| **Nikhil Krishna R D** | [@rdnk2004](https://github.com/rdnk2004) | **Lead Full-Stack & SaaS Platform Architect**<br>• Architected the role-separated multi-tenant infrastructure across Student, Employer, Academic Admin, and Public verification personas<br>• Built the complete Next.js 15 App Router frontend tier (17 production routes, dark-mode design system, and reactive global store)<br>• Engineered the Employer Talent Radar, Weighted Deficit Resistance Model, Blind DEI Screening engine, and 5-stage recruitment pipeline Kanban<br>• Designed the immutable SHA-256 cryptographic proof-of-work credential ledger and public zero-auth verification portal (`/verify/[hash]`)<br>• **Sprint 1 Lead (Database Persistence & Hardened RBAC):** Spearheaded migration from in-memory hackathon state to SQLAlchemy 2.0 dual-engine persistence (managed cloud PostgreSQL + SQLite), authored Alembic versioned migrations for multi-tenant organizations & subscriptions, and implemented server-side RBAC dependencies (`require_role`) with automatic Bearer token handling in `client.ts`<br>• **Sprint 2 Lead (Isolated Execution Sandbox):** Eliminated mock regex heuristics in `sandbox.py`; built the static AST security analyzer (`AstSecurityAnalyzer`), the ephemeral in-memory 50,000-row relational database benchmark with authentic `EXPLAIN QUERY PLAN` telemetry, the process-isolated Python runner with 3.0s timeout protection, and the live query plan telemetry UI<br>• **Sprint 3 Lead (Real LLM Orchestration, Unified ATS Parser & Dynamic Career Roadmaps):** Deprecated hardcoded mock PDF parsing heuristics in `/resume/parse` and connected unified `pdfplumber` + Groq/instructor ATS parsing pipeline with automatic schema normalizer; implemented dynamic LLM + semantic rubric evaluation for AI mock interviews scoring clarity, technical depth, and confidence with context-aware feedback; connected CareerCompass roadmaps to genuine 13-course catalog with dynamic 90-day phase generator; enhanced frontend with live rubric scorecards, 1-click curriculum generation, and ATS profile sync<br>• **Sprint 4 Lead (Database Unification, Multi-Tenant Data Persistence & Auth Consolidation):** Unified dual-database architecture onto SQLAlchemy 2.0 ORM session factory (`app.db.session.get_db`); eradicated in-memory `mock_db` persistence and connected user registration, authentication, organization directory, assessments, ATS resume storage, incoming job alerts, and 21-day deadline notifications to relational tables (`users`, `organizations`, `assessments`, `ats_resumes`, `jobs`, `user_notifications`); modernized FastAPI application lifecycle with modern `lifespan` context manager; eliminated all Pydantic/FastAPI deprecations; and engineered end-to-end 360-degree integration test suite achieving 100/100 passing tests (100% pass rate)<br>• **Sprint 5 Lead (SaaS Billing, Metering, Dual Payment Gateways & Subscription Webhooks):** Engineered end-to-end commercial monetization infrastructure with dual payment gateways (Razorpay in INR paise for domestic Indian clients & Stripe in USD cents for global enterprise B2B); built HMAC-SHA256 cryptographic webhook listeners (`/api/v1/billing/webhooks/{provider}`) handling payment success, renewal, and cancellation events; implemented multi-tenant usage metering and automated quota enforcement (`HTTP 402 Payment Required`) guarding active job requisitions and candidate evaluations; replaced mock simulation mode on frontend pricing page with live 3-step checkout, telemetry, and signature verification; and delivered 360-degree integration test suite achieving 109/109 passing tests (100% pass rate)<br>• **Sprint 6 Lead (Repository Hygiene, Deprecated Artifact Pruning & QA Manual Test Specifications):** Spearheaded comprehensive repository audit removing stale binary databases (`skillsetu.db`), legacy in-memory mock databases (`mock_db.py`), hardcoded mock candidate seeders (`seed_fr05_mock_candidate.py`), and unreferenced static frontend assets; authored production manual QA testing runbook (`MANUAL_TESTING_GUIDE.txt`) detailing verified credentials, role-based workflows, dual-gateway payment test scenarios, and sandbox verification<br>• **Sprint 7 Lead (Real-Time WebSockets & Collaborative Hiring Pipeline):** Engineered tenant-isolated WebSocket connection manager (`HiringCollaborationManager`) supporting live peer presence tracking, heartbeats, and room broadcasting (`/ws/hiring/{org_id}`); created relational models (`PipelineStageChange`, `CandidateScorecard`, `RecruiterNote`) with automatic stage progression notifications; implemented REST endpoints for collaborative stage transitions, multi-reviewer scorecards with automated consensus calculations (composite score, recommendation distributions, agreement metrics), and recruiter notes; engineered frontend real-time sync hook (`useCollaborationSocket`), collaborative candidate scorecard drawer, and live badge telemetry on the recruitment pipeline Kanban; built 360-degree integration test suite achieving 117/117 passing tests (100% pass rate)<br>• **Sprint 8 Lead (Multimodal AI Interview Coach, Speech/Vision Telemetry & Streamlit Academic Deployment):** Engineered fully autonomous multimodal AI interview coach microservice (`services/interview_coach/`) deployable in dual-mode: 1-click standalone Streamlit application on port 8501 for college viva/academic project review, standalone FastAPI service on port 8005, or mounted directly into the core Aspire AI platform (`/api/v1/interview-coach/*`); authored mathematical Composite Hireability Index (CHI = 0.50 Technical + 0.25 Vocal + 0.25 Non-Verbal) with cadence (WPM) penalties, filler word detection, and gaze/stability tracking; engineered adaptive multi-turn questioning engine with Groq Llama 3.3 70B and deterministic fallback; created Next.js 15 studio (`/interview-coach`) with device check modal and live speech telemetry HUD; authored comprehensive thesis report (`ACADEMIC_PROJECT_REPORT.md`) and viva defense guide (`VIVA_PRESENTATION_GUIDE.md`); expanded test suite to 142/142 passing tests (100% pass rate) |

---

## 🏆 SaaS Commercialization Milestones & Engineering Roadmap

Following the [Full-Stack & SaaS Architectural Audit](SkillSetu_AI_SaaS_Architectural_Audit.pdf), Aspire AI has evolved from a 48-hour hackathon prototype into a hardened, production-grade enterprise platform.

### ✅ Sprint 1: Production Multi-Tenancy, Database Persistence & Hardened RBAC (Completed)
- **Branch:** `feat/sprint-1-database-persistence-and-hardened-rbac`
- **10 Atomic Commits (`fdbcd4c` → `346bc01`)**:
  1. `chore(deps): declare sqlalchemy, alembic, and psycopg2 in requirements`
  2. `feat(db): establish sqlalchemy 2.0 dual-engine session factory and connection pooling`
  3. `feat(models): create declarative multi-tenant saas models with relational constraints`
  4. `feat(migrations): initialize alembic migration environment and baseline schema revision`
  5. `feat(db): implement production database seeder with default multi-tenant organizations`
  6. `refactor(sprints): replace in-memory sprint storage with persistent database models`
  7. `feat(auth): implement hardened rbac fastapi dependencies for employer, student, and admin`
  8. `fix(client): eliminate client-side auth bypass and inject bearer tokens in http client`
  9. `test(sprint1): add comprehensive integration test suite for rbac and database persistence`
  10. `fix(db): ensure Base.metadata.create_all and user column migrations run before seeding`
- **Key Deliverables:**
  - **SQLAlchemy 2.0 Dual-Engine Architecture**: Auto-connects to managed cloud PostgreSQL (Supabase / Neon / AWS RDS) via `DATABASE_URL` with zero-friction fallback to local SQLite (`aspire.db`).
  - **Alembic Versioned Migrations**: Automated database migrations for `organizations`, `organization_memberships`, `subscriptions`, `dispatched_sprints`, and `verified_credentials`.
  - **Hardened RBAC Security**: FastAPI dependency injection (`require_role("employer")`, `require_role("admin")`, `require_role("student")`) preventing horizontal privilege escalation.
  - **Client Token Handling**: Eliminated `finally` auth bypass in `frontend/src/app/login/page.tsx`; automatic `Authorization: Bearer <token>` injection on all API requests in `frontend/src/lib/api/client.ts`.

---

### ✅ Sprint 2: Real Containerized & Isolated Code Execution Sandbox (Completed)
- **Branch:** `feat/sprint-2-isolated-code-execution-sandbox`
- **8 Atomic Commits (`f9dd7ab` → `dcab27e`)**:
  1. `feat(sandbox): create abstract execution runner interface and execution models`
  2. `feat(sandbox): implement ast security analyzer blocking dangerous imports and syscalls`
  3. `feat(sandbox): implement isolated python subprocess runner with strict execution timeout`
  4. `feat(sandbox): implement ephemeral database performance sandbox with 50k rows and explain query plan analyzer`
  5. `feat(sandbox): implement cloud judge0 and container runner abstraction`
  6. `refactor(sandbox): replace regex heuristics in sandbox api with real execution engine and add run-tests endpoint`
  7. `feat(frontend): enhance dynamic sandbox modal with real-time execution plan output and error telemetry`
  8. `test(sandbox): create comprehensive integration test suite for sprint 2 execution sandbox`
- **Key Deliverables:**
  - **Eliminated Mock Regex Heuristics**: Wiped out `if "create index" in code_lower` and `len(code_clean) > 25` from `backend/app/api/v1/sandbox.py`. Anti-cheating now blocks spoofed comments.
  - **Static AST Security Sanitizer (`AstSecurityAnalyzer`)**: Walks Python AST trees before execution, blocking blacklisted modules (`os`, `sys`, `subprocess`, `shutil`, `socket`, `pty`, `pathlib`, `ctypes`) and dangerous calls (`eval`, `exec`, `open`, `__import__`).
  - **Ephemeral Relational Database Benchmark (`EphemeralDatabaseRunner`)**: In-memory database with **50,000 synthetic `users` rows**; executes candidate DDL; extracts authentic `EXPLAIN QUERY PLAN` confirming transition from `SCAN users` to `SEARCH users USING INDEX idx_users_email`; measures real latency drop (-99.5%).
  - **Isolated Python Subprocess Runner (`IsolatedPythonRunner`)**: Process-isolated execution harness with strict **3.0-second wall-clock timeout**, catching infinite loops, blocking `time.sleep()` calls, and event loop deadlocks.
  - **Cloud Judge0 / Docker Adapter (`Judge0SandboxRunner` & `SandboxRunnerFactory`)**: Dynamic runner factory ready for enterprise remote container deployments.
  - **Frontend Telemetry (`DynamicSandboxModal.tsx`)**: Renders real-time `EXPLAIN QUERY PLAN` terminal telemetry, microsecond latency badges, and AST security feedback.
  - **Backend Test Suite**: **81/81 passing pytest tests** with 100% pass rate.

---

### ✅ Sprint 3: Real LLM Orchestration, Unified ATS Parser & Dynamic Career Roadmaps (Completed)
- **Branch:** `feat/sprint-3-real-llm-orchestration-and-evaluation`
- **8 Atomic Commits (`6c327fa` → `36c170a`)**:
  1. `feat(ats): enhance parser service with unified schema normalizer and layout extractor`
  2. `refactor(resume): deprecate mock pdf parser and connect upload-pdf to unified ats engine`
  3. `feat(interview): implement dynamic llm interview evaluator and rubric grading service`
  4. `refactor(career-compass): connect interview question and evaluation routes to dynamic evaluator`
  5. `feat(roadmap): connect career compass roadmaps to real course catalog and dynamic curriculum generator`
  6. `feat(frontend): wire dynamic roadmap generation and enhance ats resume drawer in student portal`
  7. `feat(frontend): enhance ai interview coach modal with dynamic scorecard and rubric metrics`
  8. `test(integration): add comprehensive test suite for sprint 3 llm orchestration and roadmaps`
- **Key Deliverables:**
  - **Unified ATS Resume Parser Engine**: Deprecated the static "Aditya Verma" mock parser in `backend/app/api/v1/resume.py`. Connected `/api/v1/resume/parse` directly to `app.services.ats.parser_service` with spatial `pdfplumber` layout-aware text extraction, Groq/instructor structured entity extraction, and intelligent regex heuristic fallback (NF2). Normalizes data into standard `ResumeSchema` / ATS payload with categorized skills (core technical, frameworks/tools, soft skills), work experience, education, and ATS score metadata.
  - **Dynamic LLM & Rubric Technical Interview Coach**: Replaced static 88.0% mock interview responses with `InterviewCoachEvaluator`. Supports dual-mode execution (Groq Llama 3.3 / semantic heuristic rubric fallback) scoring answers on Clarity, Technical Accuracy, and Confidence, dynamically generating contextual praise, improvement points, and production model answers.
  - **Catalog-Backed Dynamic Career Roadmaps**: Connected CareerCompass to the 13 modular courses in `courses/`, matching candidate skill gaps (e.g., Python, SQL, AWS, Docker) to real lessons, estimated hours, and 20-question mock tests with 60% passing gates across 3 progressive phases (Fundamentals, Advanced Implementation, Production Readiness).
  - **Interactive Frontend Telemetry**: Added 1-click dynamic AI curriculum generation to `ReadinessRoadmap.tsx`, live metric progress bars (clarity, accuracy, confidence) and collapsible model answers to `AIInterviewerModal.tsx`, and real profile autofill to `ResumeUploadDrawer.tsx`.
  - **Enterprise Test Suite**: **92/92 passing pytest tests** with 100% pass rate.

---

### ✅ Sprint 4: Database Unification, Real Multi-Tenant Data Persistence & Auth Consolidation (Completed)
- **Branch:** `feat/sprint-4-database-unification-and-auth-persistence`
- **6 Atomic Commits (`0591800` → `7b1b847`)**:
  1. `feat(auth): migrate authentication, registration, and org endpoints to sqlalchemy persistence`
  2. `feat(db): migrate jobs, assessments, resumes, and notifications to unified sqlalchemy session`
  3. `refactor(main): modernize lifespan event handlers and consolidate route mountings`
  4. `refactor(db): eliminate mock_db dependencies across all core api services`
  5. `test(sprint4): add 360-degree integration test suite for database unification and auth persistence`
  6. `docs(sprint4): document sprint 4 database unification, auth persistence, and migration results`
- **Key Deliverables:**
  - **Single Source of Truth Database**: Unified all backend endpoints on SQLAlchemy 2.0 ORM sessions (`SessionLocal` / `get_db`). Migrated user registration, login, profile queries, and organization listings from in-memory `mock_db` dictionaries to relational `users`, `organizations`, and `organization_memberships` tables.
  - **ORM-Backed Assessment, Resume & Job Subsystems**: Migrated raw SQLite string interpolations in `assessments.py`, `resume.py`, `jobs.py`, and `notifications.py` to type-safe SQLAlchemy models (`Assessment`, `AtsResume`, `Job`, `SavedJob`, `UserNotification`).
  - **Deprecation of `mock_db`**: Added formal deprecation notice and runtime warning to `mock_db.py`; eliminated all active runtime imports across core API services.
  - **Modernized FastAPI Lifespan**: Converted deprecated `@app.on_event` startup/shutdown to modern `@asynccontextmanager async def lifespan(app: FastAPI)` handler; consolidated route mountings with backwards-compatible aliases hidden from Swagger schemas.
  - **360-Degree Integration Suite**: Added `test_sprint4_unification_and_persistence.py` bringing entire backend regression coverage to **100/100 tests passing with 100% pass rate**.

---

### ✅ Sprint 5: SaaS Billing, Metering, Dual Payment Gateways & Subscription Webhooks (Completed)
- **Branch:** `feat/sprint-5-saas-billing-metering-and-payment-webhooks`
- **6 Atomic Commits (`0f066f9` → `39a50a6`)**:
  1. `feat(billing): extend subscription schema with usage metering, quotas, and plan catalog`
  2. `feat(billing): implement dual payment gateway adapter for razorpay and stripe`
  3. `feat(billing): add cryptographic webhook listeners and subscription lifecycle event handlers`
  4. `feat(billing): implement multi-tenant usage metering and quota enforcement dependencies`
  5. `feat(frontend): connect pricing page to live checkout and subscription verification`
  6. `test(sprint5): add 360-degree integration test suite for saas billing, webhooks, and metering`
- **Key Deliverables:**
  - **Dual Payment Gateways**: Built an enterprise `PaymentGatewayService` supporting **Razorpay** (INR domestic payments in paise with order generation and SHA-256 HMAC signature verification) and **Stripe** (USD international B2B checkout sessions in cents with webhook signature verification).
  - **Cryptographic Webhook Handlers (`/api/v1/billing/webhooks/{provider}`)**: Secure webhook listeners verifying raw payload signatures with provider secrets, handling order fulfillment, plan activations, automated recurring renewals, and subscription cancellations.
  - **Multi-Tenant Usage Metering & Quota Enforcement (`QuotaEnforcementService`)**: Enforced tenant quotas returning structured `HTTP 402 Payment Required` with required upgrades when limits are reached:
    - **Active Job Requisitions**: Enforced on `/api/v1/jobs/ingest` and `/api/v1/jobs` (e.g. Starter: 3 active jobs, Growth: 10 active jobs, Enterprise: unlimited).
    - **Candidate ATS Evaluations**: Enforced and metered on automated candidate matching (`/api/v1/jobs/{job_id}/match-all`) tracking monthly usage against plan limits.
  - **Unified Plan Catalog & Telemetry (`/api/v1/billing/plans` & `/api/v1/billing/subscription`)**: Tiered SaaS plan definition catalog (`student_free`, `student_pro`, `starter`, `growth`, `enterprise`) with audience filtering (`student` vs `employer`) and dynamic telemetry exposing active usage against quota thresholds.
  - **Interactive Live Checkout Frontend (`frontend/src/app/pricing/page.tsx`)**: Replaced hackathon simulation modal (`💡 Demo Simulation Mode`) with live 3-step checkout flow (Plan Selection → Gateway Order Creation → Cryptographic Payment Authorization & Verification), active subscription telemetry banner, and real-time error handling.
  - **Enterprise Test Suite**: Added `test_sprint5_billing_and_metering.py` bringing entire backend regression coverage to **109/109 tests passing with 100% pass rate**.

---

### ✅ Sprint 6: Codebase Hygiene, Deprecated Artifact Pruning & QA Test Specifications (Completed)
- **Branch:** `chore/cleanup-redundant-artifacts-and-deprecated-modules`
- **Key Deliverables:**
  - **Pruned Dead Databases & Mock Residues**: Safely removed deprecated binary database (`backend/app/db/skillsetu.db`), legacy in-memory dictionary storage (`backend/app/db/mock_db.py`), hardcoded mock candidate seeders (`backend/seed_fr05_mock_candidate.py`), and redundant historical markdown specs.
  - **Pruned Unreferenced Frontend Boilerplate**: Cleaned unused Next.js templates and icons from `frontend/public/` keeping assets lean.
  - **Production Manual QA Runbook (`MANUAL_TESTING_GUIDE.txt`)**: Authored comprehensive plain-text testing manual with test account credentials across Student, Employer, and Admin roles, detailed step-by-step test instructions for ATS upload, 20-question skill verification, dual-gateway payment checkout, code sandbox AST injection verification, and real-time collaboration.

---

### ✅ Sprint 7: Real-Time WebSockets & Collaborative Hiring Pipeline (Completed)
- **Branch:** `feat/sprint-7-realtime-websockets-and-collaborative-hiring`
- **6 Atomic Commits (`5dc0b7f` → `f5995aa`)**:
  1. `feat(collaboration): add relational models for pipeline stage changes, scorecards, and recruiter notes`
  2. `feat(collaboration): implement tenant-isolated websocket connection manager for real-time hiring`
  3. `feat(collaboration): add websocket hiring gateway, live stage movement, scorecards, and notes api`
  4. `feat(frontend): create collaboration api client, typed contracts, and websocket sync hook`
  5. `feat(frontend): connect pipeline kanban to live websocket sync and add multi-reviewer scorecard drawer`
  6. `test(sprint7): add 360-degree integration test suite for websockets, collaborative kanban, and scorecards`
- **Key Deliverables:**
  - **Tenant-Isolated WebSocket Architecture (`/ws/hiring/{org_id}`)**: Engineered a robust `HiringCollaborationManager` managing tenant rooms, JWT query parameter authentication, active peer presence tracking (`RECRUITER_JOINED`, `RECRUITER_LEFT`, `PEER_LIST`), periodic keep-alive heartbeats (`PING`/`PONG`), and multi-recruiter broadcast channels.
  - **Relational Collaboration Ledger & Stage Tracking**: Authored declarative models `PipelineStageChange` (immutable audit trail of stage transitions with reasons and actor IDs), `CandidateScorecard` (multi-reviewer evaluations with 4 rubric categories and hiring recommendations), and `RecruiterNote` (private notes and team observations) with relational constraints and automatic schema seeding.
  - **Collaborative Pipeline Movement & Real-Time Sync (`/api/v1/collaboration/pipeline/move`)**: Atomic stage progression endpoint updating candidate pipeline status, recording audit changes, generating automatic candidate stage-advancement notifications for interview/offer milestones, and broadcasting `STAGE_CHANGED` events to all connected recruiters across the tenant.
  - **Multi-Reviewer Scorecards & Team Consensus Engine (`/api/v1/collaboration/scorecards`)**: Structured interview evaluation system with 4 rating dimensions (Technical, Communication, Problem Solving, Culture Add; 1-5 scale) and consensus computation calculating composite scores, average sub-scores, recommendation distributions (`strong_hire`, `hire`, `neutral`, `do_not_hire`), and team alignment verdict (`consensus_hire`, `lean_hire`, `mixed_consensus`, `consensus_no_hire`).
  - **Recruiter Private Notes & Activity History (`/api/v1/collaboration/notes` & `/pipeline/history/{candidate_id}`)**: Secure notes API for hiring managers and recruiters to exchange confidential observations, alongside complete historical timeline inspection of candidate stage progressions.
  - **Reactive Frontend Kanban & Scorecard Reviewer (`frontend/src/components/employer/PipelineKanban.tsx` & `CandidateScorecardDrawer.tsx`)**: Upgraded hiring board with live WebSocket connection indicator, optimistic drag-and-drop / stage advancement synchronizing instantly across recruiter tabs, dynamic multi-reviewer scorecard drawer, and score distribution metrics.
  - **Enterprise 360-Degree Integration Suite**: Added `test_sprint7_collaboration_and_websockets.py` verifying WebSocket handshake, heartbeats, stage broadcasts, scorecard consensus algorithms, recruiter notes, tenant isolation, and strict RBAC authorization; bringing the complete test suite to **117/117 passing tests with 100% pass rate**.

---

### ✅ Sprint 8: Multimodal AI Interview Coach with Video & Audio Telemetry (Completed)
- **Branch:** `feat/sprint-8-multimodal-ai-interview-coach`
- **7 Atomic Commits (`c220355` → `885f742`)**:
  1. `docs(plans): add sprint 8 multimodal ai interview coach and streamlit academic deployment plan`
  2. `feat(interview-coach): scaffold standalone module with mathematical scoring algorithms`
  3. `feat(interview-coach): implement speech acoustics and vision telemetry analyzers`
  4. `feat(interview-coach): add adaptive multi-turn questioning and follow-up trap logic`
  5. `feat(interview-coach): build standalone fastAPI microservice, streamlit app, and zero-dependency web interface`
  6. `feat(backend): mount standalone interview coach microservice into core aspire API`
  7. `feat(frontend): build interactive interview coach studio with live audio/video telemetry HUD`
  8. `docs(academic): add comprehensive academic project report and viva presentation guide`
- **Key Deliverables:**
  - **Decoupled Autonomous Architecture (`services/interview_coach/`)**: Engineered a self-contained, modular interview coaching subsystem capable of running independently for college viva evaluations or seamlessly mounted inside the Aspire AI platform (`/api/v1/interview-coach/*`).
  - **1-Click Standalone Streamlit Academic App (`streamlit_app.py`)**: Authored an interactive Streamlit application with native audio recording, camera input, role presets (Backend, Frontend, DevOps, Full-Stack, System Design), real-time speech telemetry sliders (WPM, filler words, pause duration), computer vision telemetry (eye-contact ratio, head stability), and comprehensive hireability scorecard visualization.
  - **Mathematical Composite Hireability Index (CHI)**:
    $$\text{CHI} = 0.50 \cdot S_{\text{tech}} + 0.25 \cdot S_{\text{vocal}} + 0.25 \cdot S_{\text{nonverbal}}$$
    - $S_{\text{tech}}$ ($0 - 100$): Semantic accuracy and architectural trade-off reasoning.
    - $S_{\text{vocal}}$ ($0 - 100$): Penalizes deviation from optimal speech cadence ($120 \le \text{WPM} \le 165$) by $0.45\text{ pts/WPM}$ and filler words by $4.0\text{ pts}$ each.
    - $S_{\text{nonverbal}}$ ($0 - 100$): Weighted formula on gaze tracking ($60\%$) and head movement stability index ($40\%$).
    - Automated committee verdict tiers: **Strong Hire** ($\ge 85$), **Hire** ($\ge 70$), **Leaning Hire** ($\ge 55$), **Needs Improvement** ($\ge 40$), **Do Not Hire** ($< 40$).
  - **Adaptive Multi-Turn Interviewer Engine (`AdaptiveInterviewerEngine`)**: Generates production-grade failure scenarios, listens to candidate answers, and fires counter-grill follow-up probes targeting missing edge cases. Powered by Groq Llama 3.3 70B with robust deterministic rubric fallback (NF2).
  - **Interactive Next.js 15 Stage (`frontend/src/app/interview-coach/page.tsx`)**: Built a full interview studio with device pre-flight check modal (camera/mic permissions), live audio waveform telemetry HUD, dynamic follow-up counter-probes, and multi-dimensional radar hireability scorecard modal.
  - **Academic Documentation & Viva Prep**: Published full thesis paper (`ACADEMIC_PROJECT_REPORT.md`) and examiner defense guide (`VIVA_PRESENTATION_GUIDE.md`) with top 10 viva questions, defenses, and 5-minute live demo scripts.
  - **Expanded 360-Degree Regression Test Suite**: Added 25 new tests across scoring math, speech acoustics, vision telemetry, adaptive questioning, and API endpoints, bringing the total platform test count to **142/142 tests passing with 100% pass rate**.

---

### 🔮 Sprint 9: Advanced Telemetry, Observability & Analytics Dashboard (Future Roadmap)
- **Target Deliverables:**
  1. **Prometheus & OpenTelemetry Metrics**: Instrument request latencies, active WebSocket connections, AST sandbox execution times, and payment throughput.
  2. **Recruitment Funnel Velocity & Analytics**: Automated conversion rate tracking, time-in-stage metrics, and recruiter response velocity dashboards.
  3. **Enterprise Billing & Usage Analytics**: Real-time spending projections, quota consumption warnings, and historical invoice management.

---

## 📂 Project Architecture

```
AI-Skill/
├── backend/
│   ├── alembic/                 # Alembic version-controlled database migrations
│   │   ├── versions/            # Schema migration history scripts
│   │   └── env.py               # Migration environment configuration
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── auth.py          # JWT authentication, session tokens & role claims
│   │   │   ├── ats.py           # ATS resume/JD parsing, comparison & vector querying
│   │   │   ├── billing.py       # SaaS plan catalog, checkout, webhooks & quota metering
│   │   │   ├── collaboration.py # WebSocket room, live pipeline movement, scorecards & notes
│   │   │   ├── courses.py       # Modular course catalog & timed mock test engine
│   │   │   ├── assessments.py   # 20-question proctored skill assessments
│   │   │   ├── career_compass.py# AI interview coach, GitHub audit & roadmaps
│   │   │   ├── jobs.py          # Job alerts, requisition feeds & matching
│   │   │   ├── resume.py        # Tailored resume studio & PDF ingestion
│   │   │   ├── sandbox.py       # Dynamic bug-fix sandbox with real execution engine
│   │   │   └── sprints.py       # 15-minute micro-sprints with DB persistence
│   │   ├── core/
│   │   │   ├── config.py        # Settings, API keys, CORS origins
│   │   │   └── security.py      # SHA-256 & bcrypt cryptographic utilities
│   │   ├── db/
│   │   │   ├── session.py       # SQLAlchemy 2.0 dual-engine session factory
│   │   │   └── aspire.db        # Local SQLite persistent database
│   │   ├── models/
│   │   │   ├── base.py          # SQLAlchemy DeclarativeBase
│   │   │   ├── entities.py      # Declarative relational tables (Users, Orgs, Scorecards, Notes)
│   │   │   └── ats.py           # Pydantic schemas (ResumeSchema, JDSchema)
│   │   └── services/
│   │       ├── ats/             # PDF/DOCX parser, ChromaDB vector & matching services
│   │       ├── billing/         # Dual gateway adapter, plan catalog & quota metering
│   │       │   ├── catalog.py   # Tiered plan definitions & feature quotas
│   │       │   ├── gateway.py   # Razorpay (INR) & Stripe (USD) payment adapters
│   │       │   └── metering.py  # Active job & candidate evaluation quota enforcement
│   │       ├── collaboration/   # Real-time WebSocket room manager & presence tracking
│   │       │   └── connection_manager.py # Tenant-isolated room multiplexer & broadcaster
│   │       └── sandbox/         # Isolated execution sandbox subsystem
│   │           ├── base.py      # BaseSandboxRunner interface & SHA-256 proof generator
│   │           ├── security.py  # AstSecurityAnalyzer static AST code sanitizer
│   │           ├── python_runner.py # Subprocess runner with 3.0s wall-clock timeout
│   │           ├── database_runner.py # In-memory 50k-row DB with EXPLAIN plan analysis
│   │           ├── judge0_runner.py # Cloud Judge0/Docker container runner adapter
│   │           └── factory.py   # Dynamic SandboxRunnerFactory dispatcher
│   ├── courses/                 # 13 JSON-authored subject curricula & mock tests
│   ├── features/                # CareerCompass feature modules (roadmap, portfolio, coach)
│   ├── requirements.txt         # Python dependencies
│   ├── test_ats_suite.py        # ATS & deficit resistance test suite
│   ├── test_sprint1_rbac_and_persistence.py # Multi-tenancy & RBAC integration suite
│   ├── test_sandbox_security.py # AST security analyzer test suite
│   ├── test_sandbox_python_runner.py # Subprocess isolation & timeout test suite
│   ├── test_sandbox_database_runner.py # 50k-row EXPLAIN query plan test suite
│   ├── test_sandbox_suite.py    # End-to-end sandbox execution & anti-cheating suite
│   ├── test_sprint4_unification_and_persistence.py # Database unification & persistence suite
│   ├── test_sprint5_billing_and_metering.py # SaaS billing, dual gateways & metering suite
│   ├── test_sprint7_collaboration_and_websockets.py # WebSockets, live pipeline & scorecard suite
│   └── run.py                   # Local dev server launcher (Port 8000)
│
├── services/
│   └── interview_coach/         # Autonomous Multimodal Interview Coach Module
│       ├── api/routes.py        # Microservice endpoints (/question, /follow-up, /evaluate)
│       ├── core/                # Config, Pydantic schemas, and mathematical scoring algorithms
│       │   ├── config.py        # Environment variables & Groq credentials
│       │   ├── schemas.py       # Speech/vision telemetry and evaluation contracts
│       │   └── scoring.py       # Composite Hireability Index (CHI) calculation engine
│       ├── engine/              # Telemetry extraction & adaptive interviewing logic
│       │   ├── audio_analyzer.py # Speech acoustics, cadence WPM & filler word detection
│       │   ├── vision_analyzer.py# Gaze tracking, eye-contact ratio & posture stability
│       │   └── interviewer.py   # Adaptive multi-turn questioning & Groq/heuristic fallback
│       ├── static/              # Zero-dependency HTML5/JS/CSS web application
│       ├── tests/               # Dedicated unit & integration tests (20 test cases)
│       ├── streamlit_app.py     # 1-Click Streamlit app for academic project review (Port 8501)
│       ├── standalone_app.py    # Independent FastAPI microservice launcher (Port 8005)
│       ├── ACADEMIC_PROJECT_REPORT.md # Thesis report with mathematical formulations
│       ├── VIVA_PRESENTATION_GUIDE.md # Viva Voce examiner Q&A defense & demo script
│       ├── run_streamlit.bat    # Windows 1-click batch launcher
│       └── requirements.txt     # Standalone dependencies for isolated deployment
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── employer/page.tsx # Talent Radar, Requisitions & 5-Stage Kanban
│   │   │   ├── student/page.tsx  # Skill Gap Radar & Micro-Learning Sprints
│   │   │   ├── admin/page.tsx    # Multi-tenant oversight & credential ledger
│   │   │   ├── pricing/page.tsx  # B2B / B2C SaaS pricing tiers & ROI calculator
│   │   │   ├── interview-coach/page.tsx # Multimodal Live Interview Studio & Telemetry HUD
│   │   │   └── login/page.tsx    # Role-separated authentication with token storage
│   │   ├── components/
│   │   │   ├── employer/         # CandidateDrawer, JobCreatorModal, TalentRadar
│   │   │   ├── student/          # DynamicSandboxModal, AIInterviewerModal, ResumeDrawer
│   │   │   ├── interview/        # DeviceCheckModal, SpeechTelemetryHUD, EvaluationReportModal
│   │   │   └── layout/Navbar.tsx # Contributor credits & navigation
│   │   ├── lib/
│   │   │   ├── api/client.ts     # Resilient HTTP client with automatic Bearer token injection
│   │   │   ├── api/interviewCoach.ts # Multimodal interview coach API client
│   │   │   └── store.ts          # Reactive client state store
│   │   └── types/index.ts        # TypeScript data contracts
│   └── package.json
└── docs/
    └── plans/                   # Architectural sprint implementation plans
        ├── 2026-09-27-sprint-1-database-persistence-and-hardened-rbac.md
        ├── 2026-09-28-sprint-2-isolated-code-execution-sandbox.md
        ├── 2026-09-29-sprint-3-real-llm-orchestration-and-evaluation.md
        └── 2026-10-08-sprint-8-multimodal-ai-interview-coach.md
```

---

## 🛠️ Setup & Running Locally

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # Configure DATABASE_URL and GROQ_API_KEY if desired
python run.py
```
* **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Telemetry Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend (Next.js 15)
```bash
cd frontend
npm install
npm run dev
```
* **Frontend Application**: [http://localhost:3000](http://localhost:3000)
* **Multimodal Interview Studio**: [http://localhost:3000/interview-coach](http://localhost:3000/interview-coach)

### 3. Standalone Multimodal Interview Coach (Streamlit Academic Deployment)
For standalone deployment or college viva presentation, run the self-contained module:
```bash
cd services/interview_coach
pip install -r requirements.txt

# Run Streamlit App on port 8501:
streamlit run streamlit_app.py --server.port=8501

# Or run with the 1-click batch launcher on Windows:
# run_streamlit.bat

# Or run as autonomous microservice on port 8005:
# python standalone_app.py --port=8005
```
* **Streamlit Academic Interface**: [http://localhost:8501](http://localhost:8501)
* **Standalone Microservice Docs**: [http://localhost:8005/docs](http://localhost:8005/docs)

---

## 🧪 Automated Test Suites

Run the complete platform test suite (**142 tests passing with 0 regressions across all suites**):
```bash
# Run all suites from repository root:
$env:PYTHONPATH="." ; pytest backend/ services/interview_coach/tests/ -v
# On Linux/macOS:
# PYTHONPATH="." pytest backend/ services/interview_coach/tests/ -v
```

Run specific subsystem test suites:
```bash
# Test Sprint 1 (RBAC, Multi-Tenancy & Database Persistence)
pytest -v backend/test_sprint1_rbac_and_persistence.py

# Test Sprint 2 (AST Security, Ephemeral 50k DB Sandbox & Timeout Runner)
pytest -v backend/test_sandbox_security.py backend/test_sandbox_python_runner.py backend/test_sandbox_database_runner.py backend/test_sandbox_suite.py

# Test Sprint 3 (ATS Parser, Dynamic Interview Rubric & Personalized Roadmap)
pytest -v backend/test_resume_parser_unified.py backend/test_interview_evaluator.py backend/test_dynamic_roadmap.py backend/test_assessments_resume_suite.py backend/test_features_suite.py

# Test Sprint 4 (Database Unification, Auth Persistence & Multi-Tenant Scoping)
pytest -v backend/test_sprint4_unification_and_persistence.py

# Test Sprint 5 (SaaS Billing, Dual Gateways, Webhooks & Metering Quotas)
pytest -v backend/test_sprint5_billing_and_metering.py

# Test Sprint 7 (Real-Time WebSockets, Collaborative Kanban & Team Consensus Scorecards)
pytest -v backend/test_sprint7_collaboration_and_websockets.py

# Test Sprint 8 (Multimodal AI Interview Coach, Speech Acoustics, Vision Telemetry & CHI Algorithms)
pytest -v services/interview_coach/tests/ backend/test_interview_coach_integration.py

# Test ATS Engine & ChromaDB Semantic Matching
pytest -v backend/test_ats_suite.py
```

Run frontend code quality linting & production build:
```bash
cd frontend
npm run lint
npm run build
```
