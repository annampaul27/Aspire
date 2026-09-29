# SkillSetu AI — Role-Separated Talent Infrastructure & Trust Engine

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-red.svg?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![Alembic](https://img.shields.io/badge/Alembic-Migrations-orange.svg)](https://alembic.sqlalchemy.org)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-FF6B6B.svg)](https://trychroma.com)
[![Groq](https://img.shields.io/badge/Groq-Llama3_Extraction-F55036.svg)](https://groq.com)
[![Pytest](https://img.shields.io/badge/Pytest-92%20Passed-brightgreen.svg?logo=pytest&logoColor=white)](https://pytest.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

SkillSetu AI bridges the gap between talent supply (students) and employer demand (corporates, universities, staffing agencies). It combines an AI-powered Applicant Tracking System (ATS), cryptographic proof-of-work credentialing (SHA-256), a dual-tier isolated execution sandbox with AST security filtering, and deterministic deficit-resistance skill matching.

---

## 👥 Contributors & Feature Attribution

| Contributor | GitHub | Role & Subsystems Engineered |
|---|---|---|
| **Nandana** | [@mnandana520](https://github.com/mnandana520) | **Feature Architect — Skill Verification & ATS Resume Studio**<br>• Designed & implemented the Skill Verification Engine (**FR-01**)<br>• 20-question, 12-minute timed assessment with automatic grading & multi-tier badge issuance (Bronze, Silver, Gold, Platinum)<br>• ATS-Friendly Tailored Resume Studio (**FR-02**) with AI spatial parsing and real-time schema editing<br>• SQLite persistence layer (`backend/app/db/database.py`) and FastAPI endpoints (`/api/v1/assessments`, `/api/v1/resume`) |
| **Jayasree A B** | [@jayasreeab2004](https://github.com/jayasreeab2004) | **Feature Architect — CareerCompass AI Modules & Course Curriculum**<br>• Designed & implemented the 8 CareerCompass feature modules (`backend/features/`)<br>• Dynamic Personalized Roadmap Generator mapping skill gaps to curriculum phases (`personalized_roadmap.py`)<br>• Designed & authored the 13 modular CareerCompass course curricula, structured lessons, and 20-question timed mock exams (`courses/`) across Python, SQL, AWS, LLM, Trees, Arrays, Django, Flask, Pandas, Javascript, HTML, CSS, Excel<br>• Fast dynamic course catalog and interactive mock testing engine (`backend/app/api/v1/courses.py`)<br>• Personalized 90-Day Career Roadmap generator (`career_roadmap.py`)<br>• AI GitHub repository project analyzer & complexity assessor (`github_analysis.py`)<br>• Dynamic mock interview coach & answer evaluation scoring (`interview_coach.py`)<br>• Real-time job market demand classifier (`job_market_analysis.py`)<br>• Automated personal developer portfolio website builder (`portfolio_builder.py`)<br>• Deep resume highlights, strengths & weakness extractor (`resume_analysis.py`)<br>• Multidimensional competency & skill gap analyzer (`skill_gap_analysis.py`) |
| **Anna M Paul** | [@annampaul27](https://github.com/annampaul27) | **Core Feature Architect — ATS & Dynamic Sandbox Engine**<br>• Designed & implemented the ATS FastAPI microservices (`/api/v1/ats/*`)<br>• Structured LLM parsing pipeline via Groq + Instructor (`ResumeSchema`, `JDSchema`)<br>• ChromaDB persistent vector repository & semantic applicant retrieval<br>• Deterministic skill gap comparison & tier segmentation (**E1, E2, E3, E4, E10**)<br>• Dynamic Code Bug-Fixer Engine & Challenge Generator (`code-bug-fixer-engine/`, `/api/v1/sandbox/*`)<br>• Real-time sandbox test runner with latency metrics & SHA-256 cryptographic proof-of-work minting |
| **Nikhil Krishna R D** | [@rdnk2004](https://github.com/rdnk2004) | **Lead Full-Stack & SaaS Platform Architect**<br>• Architected the role-separated multi-tenant infrastructure across Student, Employer, Academic Admin, and Public verification personas<br>• Built the complete Next.js 15 App Router frontend tier (17 production routes, dark-mode design system, and reactive global store)<br>• Engineered the Employer Talent Radar, Weighted Deficit Resistance Model, Blind DEI Screening engine, and 5-stage recruitment pipeline Kanban<br>• Designed the immutable SHA-256 cryptographic proof-of-work credential ledger and public zero-auth verification portal (`/verify/[hash]`)<br>• **Sprint 1 Lead (Database Persistence & Hardened RBAC):** Spearheaded migration from in-memory hackathon state to SQLAlchemy 2.0 dual-engine persistence (managed cloud PostgreSQL + SQLite), authored Alembic versioned migrations for multi-tenant organizations & subscriptions, and implemented server-side RBAC dependencies (`require_role`) with automatic Bearer token handling in `client.ts`<br>• **Sprint 2 Lead (Isolated Execution Sandbox):** Eliminated mock regex heuristics in `sandbox.py`; built the static AST security analyzer (`AstSecurityAnalyzer`), the ephemeral in-memory 50,000-row relational database benchmark with authentic `EXPLAIN QUERY PLAN` telemetry, the process-isolated Python runner with 3.0s timeout protection, and the live query plan telemetry UI<br>• **Sprint 3 Lead (Real LLM Orchestration, Unified ATS Parser & Dynamic Career Roadmaps):** Deprecated hardcoded mock PDF parsing heuristics in `/resume/parse` and connected unified `pdfplumber` + Groq/instructor ATS parsing pipeline with automatic schema normalizer; implemented dynamic LLM + semantic rubric evaluation for AI mock interviews scoring clarity, technical depth, and confidence with context-aware feedback; connected CareerCompass roadmaps to genuine 13-course catalog with dynamic 90-day phase generator; enhanced frontend with live rubric scorecards, 1-click curriculum generation, and ATS profile sync |

---

## 🏆 SaaS Commercialization Milestones & Engineering Roadmap

Following the [Full-Stack & SaaS Architectural Audit](SkillSetu_AI_SaaS_Architectural_Audit.pdf), SkillSetu AI has evolved from a 48-hour hackathon prototype into a hardened, production-grade enterprise platform.

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
  - **SQLAlchemy 2.0 Dual-Engine Architecture**: Auto-connects to managed cloud PostgreSQL (Supabase / Neon / AWS RDS) via `DATABASE_URL` with zero-friction fallback to local SQLite (`skillsetu.db`).
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

### 🔮 Sprint 4: SaaS Billing, Metering & Payment Webhooks (Future Roadmap)
- **Target Deliverables:**
  1. **Dual Payment Gateways**: Razorpay integration for Indian domestic clients (UPI, NetBanking, RuPay) and Stripe integration for global B2B employers.
  2. **Subscription Webhooks**: FastAPI webhook listeners handling `checkout.session.completed`, `invoice.payment_succeeded`, and `customer.subscription.deleted`.
  3. **Multi-Tenant Usage Metering**: Automated enforcement of plan tier quotas:
     - **Starter Tier**: 3 active job requisitions, 50 candidate screens/month.
     - **Growth Tier**: 10 active job requisitions, 300 candidate screens/month.
     - **Enterprise Tier**: Unlimited requisitions, custom sandbox repos, dedicated SLA.
  4. **Frontend Checkout Flow**: Live payment modal activation in `frontend/src/app/pricing/page.tsx` replacing simulation dialogs.

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
│   │   │   └── skillsetu.db     # Local SQLite persistent database
│   │   ├── models/
│   │   │   ├── base.py          # SQLAlchemy DeclarativeBase
│   │   │   ├── saas.py          # Multi-tenant models (Org, Sprints, Credentials)
│   │   │   └── ats.py           # Pydantic schemas (ResumeSchema, JDSchema)
│   │   └── services/
│   │       ├── ats/             # PDF/DOCX parser, ChromaDB vector & matching services
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
│   └── run.py                   # Local dev server launcher (Port 8000)
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── employer/page.tsx # Talent Radar, Requisitions & 5-Stage Kanban
│   │   │   ├── student/page.tsx  # Skill Gap Radar & Micro-Learning Sprints
│   │   │   ├── admin/page.tsx    # Multi-tenant oversight & credential ledger
│   │   │   ├── pricing/page.tsx  # B2B / B2C SaaS pricing tiers & ROI calculator
│   │   │   └── login/page.tsx    # Role-separated authentication with token storage
│   │   ├── components/
│   │   │   ├── employer/         # CandidateDrawer, JobCreatorModal, TalentRadar
│   │   │   ├── student/          # DynamicSandboxModal, AIInterviewerModal, ResumeDrawer
│   │   │   └── layout/Navbar.tsx # Contributor credits & navigation
│   │   ├── lib/
│   │   │   ├── api/client.ts     # Resilient HTTP client with automatic Bearer token injection
│   │   │   └── store.ts          # Reactive client state store
│   │   └── types/index.ts        # TypeScript data contracts
│   └── package.json
└── docs/
    └── plans/                   # Architectural sprint implementation plans
        ├── 2026-09-27-sprint-1-database-persistence-and-hardened-rbac.md
        ├── 2026-09-28-sprint-2-isolated-code-execution-sandbox.md
        └── 2026-09-29-sprint-3-real-llm-orchestration-and-evaluation.md
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

---

## 🧪 Automated Test Suites

Run the complete backend test suite (**92 tests passing with 0 regressions**):
```bash
cd backend
python -m pytest -v
```

Run specific subsystem test suites:
```bash
# Test Sprint 1 (RBAC, Multi-Tenancy & Database Persistence)
pytest -v test_sprint1_rbac_and_persistence.py

# Test Sprint 2 (AST Security, Ephemeral 50k DB Sandbox & Timeout Runner)
pytest -v test_sandbox_security.py test_sandbox_python_runner.py test_sandbox_database_runner.py test_sandbox_suite.py

# Test Sprint 3 (ATS Parser, Dynamic Interview Rubric & Personalized Roadmap)
pytest -v test_resume_parser_unified.py test_interview_evaluator.py test_dynamic_roadmap.py test_assessments_resume_suite.py test_features_suite.py

# Test ATS Engine & ChromaDB Semantic Matching
pytest -v test_ats_suite.py
```

Run frontend code quality linting & production build:
```bash
cd frontend
npm run lint
npm run build
```
