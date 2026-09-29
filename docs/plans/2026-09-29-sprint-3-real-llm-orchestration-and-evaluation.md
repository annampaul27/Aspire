# Sprint 3 Implementation Plan: Real LLM Orchestration, Unified ATS Parser & Dynamic Career Roadmaps

> **For Claude / Agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate hackathon AI simulations by implementing real LLM orchestration and evaluation across three critical engines identified in Sections 4.2, 4.3, 4.4, Milestone 3, and Section 8 Priority 3 of `SkillSetu_AI_SaaS_Architectural_Audit.pdf`: (1) consolidate PDF resume parsing onto an authentic `pdfplumber` + Groq/instructor pipeline, removing the static "Aditya Verma" mock in `resume.py`; (2) connect the AI Technical Interview Coach in `career_compass.py` to dynamic rubric-based evaluation (eliminating hardcoded 88.0% scores); and (3) connect `career_roadmap.py` to the genuine course catalog database (`courses/`) to construct tailored 90-day learning paths.

**Architecture:**
1. **Unified ATS Parser Pipeline (`parser_service.py` & `resume.py`)**: Consolidates `/api/v1/resume/upload-pdf` and `/api/v1/ats/parse-resume` onto a shared parser service using `pdfplumber` for layout-aware text extraction and Groq/instructor for structured entity normalization, backed by deterministic regex heuristics for offline/fallback resilience.
2. **Dynamic AI Interview Evaluator (`app.services.interview.evaluator`)**: Provides an adaptive technical question generator and multi-dimensional rubric grader (`overall_score`, `clarity`, `technical_accuracy`, `confidence_estimate`, `what_went_well`, `what_to_improve`, `better_answer`) replacing the static 88.0% mock in `career_compass.py`.
3. **Dynamic Course-Backed Roadmap Engine (`personalized_roadmap.py` & `career_compass.py`)**: Resolves specific candidate skill gaps against the 13 modular courses in `courses/`, generating personalized 3-phase, 90-day curricula with verified course slugs, lesson milestones, and weekly study hour budgeting.
4. **Frontend Student Experience (`ResumeUploadDrawer.tsx`, `AIInterviewerModal.tsx`, `ReadinessRoadmap.tsx`)**: Reflects authentic extracted resume entities, live interview scoring breakdowns, and 1-click dynamic AI curriculum generation from real course data.

**Tech Stack:** Python 3.11, FastAPI, `pdfplumber`, `python-docx`, Groq LLM / `instructor`, ChromaDB vector embeddings, Next.js 16 / React 19, TypeScript, Vanilla CSS.

---

## Sprint 3 Commit Roadmap (8 Granular Atomic Commits)

| # | Commit Message | Scope & Purpose | Target Files |
|---|----------------|-----------------|--------------|
| **1** | `feat(ats): enhance parser service with unified schema normalizer and layout extractor` | Unified resume extraction and normalization pipeline supporting PDF/DOCX with structured Pydantic schemas | `backend/app/services/ats/parser_service.py`<br>`backend/app/services/ats/schemas.py` |
| **2** | `refactor(resume): deprecate mock pdf parser and connect upload-pdf to unified ats engine` | Eliminate `mock_ai_parse_pdf_content` (static Aditya Verma mock) and parse real text/metadata from uploaded documents | `backend/app/api/v1/resume.py`<br>`backend/test_resume_parser_unified.py` |
| **3** | `feat(interview): implement dynamic llm interview evaluator and rubric grading service` | Real LLM question generation and rubric-based response evaluation scoring clarity, technical depth, and confidence dynamically | `backend/app/services/interview/__init__.py`<br>`backend/app/services/interview/evaluator.py`<br>`backend/app/services/interview/schemas.py` |
| **4** | `refactor(career-compass): connect interview question and evaluation routes to dynamic evaluator` | Replace hardcoded 88.0% mock scores with dynamic evaluation results from the interview service | `backend/app/api/v1/career_compass.py`<br>`backend/test_interview_evaluator.py` |
| **5** | `feat(roadmap): connect career compass roadmaps to real course catalog and dynamic curriculum generator` | Build dynamic 3-phase curricula referencing real courses and lessons for candidate skill gaps | `backend/app/api/v1/career_compass.py`<br>`backend/features/career_roadmap.py`<br>`backend/test_dynamic_roadmap.py` |
| **6** | `feat(frontend): wire dynamic roadmap generation and enhance ats resume drawer in student portal` | Connect 1-click dynamic AI curriculum generation and ensure real PDF extraction populates candidate profile | `frontend/src/components/student/ReadinessRoadmap.tsx`<br>`frontend/src/components/student/ResumeUploadDrawer.tsx` |
| **7** | `feat(frontend): enhance ai interview coach modal with dynamic scorecard and rubric metrics` | Render dynamic scorecards, category progress bars, and targeted improvement suggestions from the evaluation engine | `frontend/src/components/student/AIInterviewerModal.tsx` |
| **8** | `test(integration): add comprehensive test suite for sprint 3 llm orchestration and roadmaps` | End-to-end verification of resume parsing, dynamic interview scoring, and roadmap generation across all test suites | `backend/test_assessments_resume_suite.py`<br>`backend/test_features_suite.py` |

---

## Detailed Task Breakdown

### Task 1: Unified ATS Parser Service & Normalizer

**Files:**
- Modify: `backend/app/services/ats/parser_service.py`
- Modify: `backend/app/models/ats.py` (or create `backend/app/services/ats/schemas.py`)

**Step 1: Define comprehensive extraction schemas**
- Extend `ResumeSchema` to include normalized fields expected by both `resume.py` and `ats.py`:
  - `personal_info`: name, email, phone, location, github_url, linkedin_url, portfolio_url
  - `skills`: technical_skills, frameworks, soft_skills
  - `work_experience`: list of positions with company, role, duration, bullet_points
  - `education`: list of degrees, institution, graduation_year
  - `user_class`: "Fresher" | "Experienced"
  - `raw_text`: sanitized full text representation

**Step 2: Enhance text extraction & fallback parsing in `parser_service.py`**
- In `extract_text_from_pdf`, ensure layout-aware multi-page text concatenation with clean line breaking.
- In `_fallback_parse_resume`, extract:
  - Actual email via regex `[\w\.-]+@[\w\.-]+\.\w+` from real text.
  - Actual phone number via regex.
  - Actual name from the first non-empty lines (avoiding static hardcoding).
  - Comprehensive skill matching against industry taxonomy (Python, FastAPI, Docker, SQL, React, etc.).
  - Work experience block detection.
  - User classification (Fresher vs Experienced) based on years of experience keywords.

**Step 3: Verification**
Run: `python -c "from app.services.ats.parser_service import extract_text, parse_resume; print('Parser service ready')"`
Expected: `Parser service ready`

**Step 4: Commit**
`git add backend/app/services/ats/`
`git commit -m "feat(ats): enhance parser service with unified schema normalizer and layout extractor"`

---

### Task 2: Deprecate Mock PDF Parser & Connect `resume.py` to Real ATS Engine

**Files:**
- Modify: `backend/app/api/v1/resume.py`
- Create: `backend/test_resume_parser_unified.py`

**Step 1: Write failing test in `test_resume_parser_unified.py`**
- Test that uploading a PDF with text "Elena Rostova", "elena.rostova@tech.io", "Specialist in Rust, Kubernetes, Distributed Systems" extracts Elena Rostova's name, email, and skills — NOT "Aditya Verma" or "Nexus Scale Labs".
- Test handling of DOCX and TXT file uploads.

**Step 2: Run test to confirm failure**
Run: `pytest test_resume_parser_unified.py -v`
Expected: FAIL (returns Aditya Verma)

**Step 3: Replace `mock_ai_parse_pdf_content` with real ATS pipeline**
- Replace lines 73-125 in `backend/app/api/v1/resume.py`:
  - Invoke `await extract_text(file_bytes, file.filename)` to extract real text.
  - Invoke `parse_resume(raw_text)` to perform structured extraction.
  - Populate `ResumeUploadResponse` with candidate data extracted from the actual file.
  - Maintain backward compatibility for all fields: `personal_info`, `skills`, `work_experience`, `education`, `user_class`.

**Step 4: Run test to confirm passing**
Run: `pytest test_resume_parser_unified.py -v`
Expected: All tests PASS.

**Step 5: Commit**
`git add backend/app/api/v1/resume.py backend/test_resume_parser_unified.py`
`git commit -m "refactor(resume): deprecate mock pdf parser and connect upload-pdf to unified ats engine"`

---

### Task 3: Dynamic LLM Technical Interview Evaluator & Rubric Service

**Files:**
- Create: `backend/app/services/interview/__init__.py`
- Create: `backend/app/services/interview/schemas.py`
- Create: `backend/app/services/interview/evaluator.py`

**Step 1: Define interview evaluation domain models**
- `InterviewQuestionRequest`: role, topic, difficulty
- `InterviewQuestion`: question_id, question_text, expected_keywords, hints, trap_followup, model_answer
- `InterviewEvalRequest`: question_text, candidate_answer, expected_keywords, role
- `InterviewMetrics`: clarity (0-100), technical_accuracy (0-100), confidence_estimate (0.0-1.0)
- `InterviewEvaluationResult`: overall_score (0-100), metrics, what_went_well (List[str]), what_to_improve (List[str]), better_answer (str)

**Step 2: Implement `InterviewCoachEvaluator`**
- Question Generation:
  - If Groq API key is present: invokes LLM via instructor for adaptive role/topic questions.
  - Deterministic Fallback: rich domain question bank covering Distributed Systems, Concurrency, Database Sharding, Caching, and Security.
- Answer Evaluation:
  - If Groq API key is present: evaluates transcript against rubrics with structured output.
  - Deterministic Semantic Rubric Grader:
    - Calculates technical accuracy based on coverage of core architectural keywords and concepts.
    - Calculates clarity based on answer length, structure, and presence of concrete examples.
    - Calculates confidence based on decisive technical terminology vs hesitant hedging.
    - Overall score: `(clarity * 0.35) + (technical_accuracy * 0.50) + (confidence * 15)`.
    - Generates context-aware constructive feedback highlighting missing concepts.

**Step 3: Verification**
Run: `python -c "from app.services.interview.evaluator import InterviewCoachEvaluator; print('Evaluator ready')"`
Expected: `Evaluator ready`

**Step 4: Commit**
`git add backend/app/services/interview/`
`git commit -m "feat(interview): implement dynamic llm interview evaluator and rubric grading service"`

---

### Task 4: Connect Career Compass Interview Endpoints to Dynamic Evaluator

**Files:**
- Modify: `backend/app/api/v1/career_compass.py`
- Create: `backend/test_interview_evaluator.py`

**Step 1: Write failing tests in `test_interview_evaluator.py`**
- Test that a rich, comprehensive technical answer receives a higher score than a vague 3-word answer (e.g. `score > 80` vs `score < 50`).
- Test that scores are NOT statically hardcoded to 88.0%.
- Test that `what_went_well` and `what_to_improve` adapt to the candidate's actual answer content.

**Step 2: Run test to confirm failure**
Run: `pytest test_interview_evaluator.py -v`
Expected: FAIL (hardcoded 88.0% on all inputs)

**Step 3: Refactor `/interview/question` and `/interview/evaluate`**
- Update `career_compass.py`:
  - Route `/interview/question` through `InterviewCoachEvaluator.generate_question(...)`.
  - Route `/interview/evaluate` through `InterviewCoachEvaluator.evaluate_answer(...)`.
  - Keep response format completely compatible with frontend `AIInterviewerModal.tsx`.

**Step 4: Run test to confirm passing**
Run: `pytest test_interview_evaluator.py -v`
Expected: All tests PASS.

**Step 5: Commit**
`git add backend/app/api/v1/career_compass.py backend/test_interview_evaluator.py`
`git commit -m "refactor(career-compass): connect interview question and evaluation routes to dynamic evaluator"`

---

### Task 5: Dynamic Course-Catalog-Backed Career Roadmaps

**Files:**
- Modify: `backend/app/api/v1/career_compass.py`
- Modify: `backend/features/career_roadmap.py`
- Create: `backend/test_dynamic_roadmap.py`

**Step 1: Write failing tests in `test_dynamic_roadmap.py`**
- Test that submitting skill gaps in "PostgreSQL", "Docker", and "Python" generates roadmap phases pointing to genuine courses from `courses/`.
- Test that generated modules include realistic estimated hours and verifiable lessons.

**Step 2: Implement dynamic roadmap synthesis**
- Update `features/career_roadmap.py` and `career_compass.py`:
  - In `prepare_career_roadmap`, integrate with `features/personalized_roadmap.py` to look up courses from `courses/` directory.
  - Map candidate skill gaps to genuine courses (`courses/sql`, `courses/python`, `courses/docker`, etc.).
  - Output structured 3-phase roadmap:
    - Phase 1: Core Fundamentals & Direct Deficits (Days 1–30)
    - Phase 2: Advanced Implementations & Distributed Scale (Days 31–60)
    - Phase 3: System Design & Production Readiness (Days 61–90)
  - Include specific course slugs, lesson milestones, and estimated weekly hours.

**Step 3: Run test to confirm passing**
Run: `pytest test_dynamic_roadmap.py -v`
Expected: All tests PASS.

**Step 4: Commit**
`git add backend/app/api/v1/career_compass.py backend/features/career_roadmap.py backend/test_dynamic_roadmap.py`
`git commit -m "feat(roadmap): connect career compass roadmaps to real course catalog and dynamic curriculum generator"`

---

### Task 6: Frontend Dynamic Roadmap Generation & Resume Extraction Wire-up

**Files:**
- Modify: `frontend/src/components/student/ReadinessRoadmap.tsx`
- Modify: `frontend/src/components/student/ResumeUploadDrawer.tsx`

**Step 1: Enhance `ResumeUploadDrawer.tsx`**
- Update `handleFileUpload` to process the unified ATS response, displaying actual extracted skills count, work experience, and educational institutions in the profile preview.

**Step 2: Wire Dynamic Roadmap in `ReadinessRoadmap.tsx`**
- Add "Generate AI 90-Day Curriculum" action button.
- Fetches `/api/v1/career-compass/personalized-roadmap` with candidate's actual unverified skills from `targetJob.criticalSkills`.
- Renders dynamic curriculum cards with course links, module prerequisites, and estimated weekly study hours.

**Step 3: Test frontend linting**
Run: `npm run lint` in `frontend/`
Expected: 0 errors, 0 warnings.

**Step 4: Commit**
`git add frontend/src/components/student/ReadinessRoadmap.tsx frontend/src/components/student/ResumeUploadDrawer.tsx`
`git commit -m "feat(frontend): wire dynamic roadmap generation and enhance ats resume drawer in student portal"`

---

### Task 7: Enhance AI Interview Coach Modal UI with Dynamic Telemetry

**Files:**
- Modify: `frontend/src/components/student/AIInterviewerModal.tsx`

**Step 1: Dynamic scorecard enhancements**
- Render dynamic clarity, technical accuracy, and confidence progress bars.
- Display context-aware feedback badges for "What Went Well" and "High-Priority Improvements".
- Render the recommended model answer with collapsible toggle.

**Step 2: Test frontend linting**
Run: `npm run lint` in `frontend/`
Expected: 0 errors, 0 warnings.

**Step 3: Commit**
`git add frontend/src/components/student/AIInterviewerModal.tsx`
`git commit -m "feat(frontend): enhance ai interview coach modal with dynamic scorecard and rubric metrics"`

---

### Task 8: Comprehensive Integration Test Suite & Zero-Regression Verification

**Files:**
- Modify: `backend/test_assessments_resume_suite.py`
- Modify: `backend/test_features_suite.py`

**Step 1: Update integration test suites**
- Verify `/api/v1/resume/upload-pdf` extracts real data.
- Verify `/api/v1/career-compass/interview/evaluate` scores dynamic answers.
- Verify `/api/v1/career-compass/personalized-roadmap` generates course-backed paths.
- Run complete test suite across monorepo.

**Step 2: Run all backend tests**
Run: `pytest backend/ -v`
Expected: 100% pass across all test suites (81+ tests passing with 0 regressions).

**Step 3: Commit**
`git add backend/test_assessments_resume_suite.py backend/test_features_suite.py`
`git commit -m "test(integration): add comprehensive test suite for sprint 3 llm orchestration and roadmaps"`

---

## Safety, Rollback & Presentation Guarantee

1. **Presentation Readiness**: All existing demo pages (`/demo`, `/student`, `/employer`, `/admin`, `/hub`) remain 100% stable with functional fallbacks.
2. **Deterministic Resiliency**: If external LLM or Groq APIs are offline or unconfigured, the deterministic semantic rubric evaluators and regex extractors guarantee sub-50ms reliable responses.
3. **Bisectable History**: Every commit compiles, passes tests, and can be checked out independently without breaking the application.
