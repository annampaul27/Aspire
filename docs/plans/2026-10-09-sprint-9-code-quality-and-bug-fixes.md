# Sprint 9: Comprehensive Code Quality Audit, Bug Fixing & Technical Debt Eradication

> **For Claude / Antigravity:** REQUIRED SUB-SKILL: Follow atomic task execution with 360-degree verification checks after every phase.

**Goal:** Conduct an exhaustive, enterprise-grade code quality overhaul across the entire Aspire AI platform (Next.js 15 frontend, FastAPI backend, and standalone interview coach microservice), resolving all ESLint errors, React 19 hook lifecycle issues, TypeScript `any` leaks, Python ruff violations, dead imports, and redundant logic.

**Architecture:** Systematic multi-phase refactoring targeting static analysis diagnostics, runtime edge cases, and component lifecycles. All edits are atomic and verified by strict compiler/linter gates (`npm run lint`, `npm run build`, `ruff check`, and 100% `pytest` pass rate).

**Tech Stack:** Next.js 16.3.6 (Turbopack), React 19.2.8, TypeScript 5, Tailwind CSS v4, ESLint 9, FastAPI 0.115, SQLAlchemy 2.0, Ruff, Pytest 9.

---

## 1. Exhaustive Code Audit & Findings Summary

A complete static analysis and code survey of the repository revealed **163 issues** across frontend and backend tiers:

### 1.1 Category A: Frontend React 19 & Next.js 15 Lifecycle Bugs (Critical)
1. **Variable Access Before Declaration (Temporal Dead Zone)**:
   - `frontend/src/lib/useCollaborationSocket.ts:136`: `connect()` is referenced in `reconnectTimeoutRef.current = setTimeout(() => connect(), 3500)` before the `connect` callback declaration.
   - `frontend/src/components/interview/LiveInterviewStage.tsx:105`: `computeLiveTelemetry()` is invoked inside `recog.onresult` prior to its declaration on line 118.
2. **Synchronous State Setting in Effects (Cascading Render Traps)**:
   - `frontend/src/lib/store.tsx:226`: `setRole`, `setCurrentStudentId`, and `setIsAuthenticated` are called synchronously inside `useEffect` during initial client session restoration, triggering avoidable re-renders.
   - `frontend/src/components/employer/CandidateScorecardDrawer.tsx:86`: `fetchScorecardsAndNotes()` is called synchronously inside `useEffect` on drawer open.
3. **Unescaped HTML Entities**:
   - `frontend/src/components/interview/LiveInterviewStage.tsx:394`: Raw unescaped quotes `"` in JSX text (`"Start Speaking"`).

### 1.2 Category B: TypeScript Type Safety & `any` Leaks (High)
Total of **24 occurrences** of `@typescript-eslint/no-explicit-any` masking contract mismatches:
- `frontend/src/lib/useCollaborationSocket.ts` (lines 10, 11, 23): Generic websocket event handlers and payloads using `any`.
- `frontend/src/components/interview/LiveInterviewStage.tsx` (lines 48, 93, 99, 108, 160, 223, 247): Speech recognition error events, window interface polyfills, and catch blocks typed as `any`.
- `frontend/src/components/employer/CandidateScorecardDrawer.tsx` (lines 55, 114, 138, 344): Form event targets, scorecard API payloads, and error catch instances typed as `any`.
- `frontend/src/app/pricing/page.tsx` (lines 99, 150, 178): Razorpay modal options, Stripe session handlers, and payment verification responses typed as `any`.

### 1.3 Category C: Dead Code & Unused Imports (Medium)
1. **Frontend Unused Imports (10 warnings)**:
   - `frontend/src/app/interview-coach/page.tsx`: `Sparkles`
   - `frontend/src/app/pricing/page.tsx`: `AlertCircle`, `isLoadingSub`
   - `frontend/src/components/employer/CandidateScorecardDrawer.tsx`: `Clock`, `ShieldCheck`, `isLoadingScorecards`
   - `frontend/src/components/employer/PipelineKanban.tsx`: `Users`
   - `frontend/src/components/interview/LiveInterviewStage.tsx`: `CheckCircle`, `RefreshCw`
   - `frontend/src/lib/api/collaboration.ts`: `PipelineStageEvent`
2. **Backend & Microservice Unused Imports (80+ ruff violations)**:
   - `backend/app/api/v1/career_compass.py`: Duplicate redefinition of `generate_personalized_roadmap` on line 271, and unused `create_roadmap_from_skill_gap_result`.
   - `backend/app/api/v1/interview_coach.py`: Unused `Depends` import.
   - `backend/app/services/ats/parser_service.py`: Ambiguous single-letter variable `l` in list comprehension on line 205.
   - `backend/app/services/sandbox/database_runner.py`: Unused assigned variable `baseline_plan_str` on line 95.
   - `backend/app/services/sandbox/python_runner.py`: `import textwrap` placed halfway down the file (line 183).
   - `services/interview_coach/`: Unused imports across core algorithms (`math`, `typing.Dict`, `typing.Any` in `scoring.py`; `typing.Tuple` in `audio_analyzer.py`; `os`, `typing.List` in `interviewer.py`; `json`, `datetime` in `streamlit_app.py`; `pytest` in tests).

### 1.4 Category D: Code Duplication & Legacy Leftovers (Medium)
1. `backend/features/interview_coach.py` contains legacy mock scoring (`score = 88.0`), whereas `backend/app/services/interview/evaluator.py` and `services/interview_coach/` are the production dynamic evaluators. The legacy file must clearly delegate to the production service or be documented with strict backwards compatibility.
2. Inconsistent exception handling returning raw exception strings in API endpoints without logging or structured detail messages.

---

## 2. Phased Implementation Roadmap

```
                               ┌─────────────────────────────────────────────────────┐
                               │  Branch: feat/sprint-9-code-quality-and-bug-fixes   │
                               └──────────────────────────┬──────────────────────────┘
                                                          │
                    ┌─────────────────────────────────────┴─────────────────────────────────────┐
                    ▼                                                                           ▼
   [PHASE 1: FRONTEND REACT & TYPESCRIPT]                                      [PHASE 2: BACKEND & SERVICES HYGIENE]
   • Fix React 19 temporal dead zones                                          • Hoist imports to top-of-file
   • Resolve cascading render in useEffect                                     • Eradicate 80+ unused imports
   • Eliminate 24 explicit 'any' types                                         • Rename ambiguous variables (l -> line)
   • Fix unescaped JSX quotes                                                  • Remove dead assigned variables
   • Eliminate 10 unused component imports                                     • Clean f-string placeholders
                    │                                                                           │
                    └─────────────────────────────────────┬─────────────────────────────────────┘
                                                          │
                                                          ▼
                                      [PHASE 3: CONSOLIDATION & 360° VERIFICATION]
                                      • npm run lint -> 0 errors, 0 warnings
                                      • npm run build -> 0 compilation errors (18 routes)
                                      • ruff check -> 0 errors
                                      • pytest -> 142/142 tests passing (100% pass rate)
                                      • Update README.md & MANUAL_TESTING_GUIDE.txt
```

---

## 3. Detailed Step-by-Step Task Breakdown

### Task 1: Branch Creation & Initial Setup
- **Branch**: `feat/sprint-9-code-quality-and-bug-fixes` branched from `feat/sprint-8-multimodal-ai-interview-coach`.
- **Commit**: `chore(quality): initialize sprint 9 code quality and bug fixing branch`

---

### Task 2: Frontend React 19 Hook Lifecycle & Variable Hoisting Fixes
- **Files to Modify**:
  - `frontend/src/lib/useCollaborationSocket.ts`
  - `frontend/src/components/interview/LiveInterviewStage.tsx`
  - `frontend/src/lib/store.tsx`
  - `frontend/src/components/employer/CandidateScorecardDrawer.tsx`
- **Actions**:
  1. In `useCollaborationSocket.ts`, wrap `connect` with a stable `useCallback` or `connectRef` so `setTimeout(() => connectRef.current?.(), 3500)` does not violate the temporal dead zone.
  2. In `LiveInterviewStage.tsx`, move `computeLiveTelemetry` definition above the speech recognition initialization effect.
  3. In `store.tsx`, eliminate the synchronous cascading render warning inside `useEffect` by using `useMounted` or clean state initializer pattern with safe localStorage read.
  4. In `CandidateScorecardDrawer.tsx`, decouple `fetchScorecardsAndNotes` from direct effect-driven synchronous mutation.
  5. In `LiveInterviewStage.tsx`, replace raw double quotes on line 394 with `&quot;`.
- **Verification**: Run `npx eslint src/lib/useCollaborationSocket.ts src/components/interview/LiveInterviewStage.tsx`.
- **Commit**: `fix(frontend): resolve react 19 temporal dead zones, cascading renders, and unescaped entities`

---

### Task 3: TypeScript Rigor — Eradicate All Explicit `any` Types
- **Files to Modify**:
  - `frontend/src/lib/useCollaborationSocket.ts`
  - `frontend/src/components/interview/LiveInterviewStage.tsx`
  - `frontend/src/components/employer/CandidateScorecardDrawer.tsx`
  - `frontend/src/app/pricing/page.tsx`
- **Actions**:
  1. Define explicit TypeScript interfaces for Web Speech API (`SpeechRecognitionErrorEvent`, `SpeechRecognitionEvent`).
  2. Define explicit types for Razorpay response objects (`RazorpaySuccessResponse`).
  3. Replace loose `any` catches with `unknown` and safe `instanceof Error` narrowing.
  4. Type scorecard drawer forms and callbacks with strict interfaces (`ReviewerScorecardPayload`).
- **Verification**: Run `npm run lint` — verify `Unexpected any` count drops from 24 to 0.
- **Commit**: `refactor(frontend): eliminate explicit any types and introduce strict typescript contracts`

---

### Task 4: Frontend Dead Code & Unused Import Elimination
- **Files to Modify**:
  - `frontend/src/app/interview-coach/page.tsx`
  - `frontend/src/app/pricing/page.tsx`
  - `frontend/src/components/employer/CandidateScorecardDrawer.tsx`
  - `frontend/src/components/employer/PipelineKanban.tsx`
  - `frontend/src/components/interview/LiveInterviewStage.tsx`
  - `frontend/src/lib/api/collaboration.ts`
- **Actions**:
  - Prune all unused icons and variables: `Sparkles`, `AlertCircle`, `isLoadingSub`, `Clock`, `ShieldCheck`, `isLoadingScorecards`, `Users`, `CheckCircle`, `RefreshCw`, `PipelineStageEvent`.
- **Verification**: Run `npm run lint` — verify **0 errors, 0 warnings** across the entire Next.js project.
- **Commit**: `chore(frontend): prune unused imports and dead variables across components and routes`

---

### Task 5: Backend Structural & Quality Fixes
- **Files to Modify**:
  - `backend/app/api/v1/career_compass.py`
  - `backend/app/services/ats/parser_service.py`
  - `backend/app/services/sandbox/database_runner.py`
  - `backend/app/services/sandbox/python_runner.py`
  - `backend/app/workers/notification_worker.py`
- **Actions**:
  1. In `career_compass.py`, remove duplicate import of `generate_personalized_roadmap` on line 271, remove unused `create_roadmap_from_skill_gap_result`, and place imports at the top of the module.
  2. In `parser_service.py`, rename ambiguous single-letter variable `l` to `line` on line 205.
  3. In `database_runner.py`, remove unused assigned local variable `baseline_plan_str` on line 95.
  4. In `python_runner.py`, hoist `import textwrap` to the top of the file.
  5. In `notification_worker.py`, organize top-of-file imports cleanly.
- **Verification**: Run `ruff check backend/app/ --select F811,F841,E741,E402`.
- **Commit**: `fix(backend): hoist module imports, rename ambiguous variables, and remove dead assignments`

---

### Task 6: Backend & Services Unused Import Pruning
- **Files to Modify**:
  - `backend/app/api/v1/interview_coach.py`
  - `backend/test_sprint5_billing_and_metering.py`
  - `services/interview_coach/api/routes.py`
  - `services/interview_coach/core/schemas.py`
  - `services/interview_coach/core/scoring.py`
  - `services/interview_coach/engine/audio_analyzer.py`
  - `services/interview_coach/engine/interviewer.py`
  - `services/interview_coach/streamlit_app.py`
  - `services/interview_coach/generate_pdf_report.py`
  - `services/interview_coach/tests/` (test files)
- **Actions**:
  - Run `ruff check backend/ services/ --fix` and audit remaining manual items to remove all 80+ unused imports cleanly.
- **Verification**: Run `ruff check backend/ services/` — verify **0 errors**.
- **Commit**: `chore(backend): clean unused imports and format string anomalies across backend and microservices`

---

### Task 7: 360-Degree Regression Testing & Documentation
- **Actions**:
  1. Run full pytest suite across `backend/` and `services/interview_coach/tests/` to guarantee **142/142 tests pass (100% pass rate)**.
  2. Run `npm run lint` and `npm run build` in `frontend/` to guarantee **0 errors and 0 warnings**.
  3. Update `README.md` and `MANUAL_TESTING_GUIDE.txt` documenting Sprint 9 code quality milestones.
  4. Push new branch to remote: `git push -u origin feat/sprint-9-code-quality-and-bug-fixes`.
- **Commit**: `docs: document sprint 9 code quality overhaul and zero-warning verification`

---

## 4. Acceptance Criteria & Quality Gates

| Quality Metric | Current State | Target State (Sprint 9 Exit) |
|---|---|---|
| **ESLint Errors & Warnings** | 24 errors, 10 warnings | **0 errors, 0 warnings** |
| **Next.js Production Build** | Compiles with warnings | **Compiles cleanly with 0 warnings** |
| **TypeScript `any` Usages** | 24 explicit `any` | **0 explicit `any`** |
| **Ruff Python Violations** | 129 errors | **0 errors** |
| **Pytest Test Suite** | 142 passed | **142 passed (100% pass rate)** |
| **Code Smells & Dead Code** | 80+ dead imports / assignments | **100% eradicated** |
