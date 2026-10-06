# Sprint 7: Real-Time WebSockets & Collaborative Hiring Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the single-user recruiter experience into a multi-tenant, real-time collaborative hiring workspace with live WebSocket event streaming, synchronized Kanban board state, multi-reviewer scorecards, private recruiter notes, and real-time candidate stage notifications.

**Architecture:** 
- **WebSocket Gateway (`/ws/hiring/{org_id}`)**: Tenant-isolated asynchronous WebSocket rooms broadcasting stage changes, scorecard ratings, and recruiter presence in real-time.
- **Relational Collaboration Models (`entities.py`)**: Type-safe SQLAlchemy 2.0 ORM models for `PipelineStageChange`, `CandidateScorecard`, and `RecruiterNote`.
- **REST Collaboration Service (`app/api/v1/collaboration.py`)**: Endpoints for atomic candidate stage moves, multi-reviewer rubric submissions with team consensus calculation, and collaborative note-taking.
- **Frontend Real-Time Synchronization (`useCollaborationSocket.ts` & `PipelineKanban.tsx`)**: Replaces client-only stage toggling with live bidirectional WebSocket events, optimistic local updates, and a multi-reviewer scorecard drawer.

**Tech Stack:** FastAPI WebSockets, Starlette WebSocket API, SQLAlchemy 2.0, Next.js 15 App Router, TypeScript, React 19, Lucide Icons, Pytest TestClient.

---

### Task 1: Collaboration Schema & Relational Models
**Files:**
- Modify: `backend/app/models/entities.py:300-360`
- Modify: `backend/app/db/seed.py:30-60`
- Test: `backend/test_sprint7_collaboration_and_websockets.py`

**Details:**
1. Create `PipelineStageChange` entity:
   - `id`: str (primary key, e.g. `stage_chg_xxx`)
   - `candidate_id`: str (ForeignKey to users.id)
   - `org_id`: str (ForeignKey to organizations.id)
   - `job_id`: Optional[str]
   - `from_stage`: str ('applied', 'screened', 'shortlisted', 'interview', 'offer', 'rejected')
   - `to_stage`: str
   - `changed_by_user_id`: str (ForeignKey to users.id)
   - `reason`: Optional[str]
   - `created_at`: datetime
2. Create `CandidateScorecard` entity:
   - `id`: str (primary key)
   - `candidate_id`: str (ForeignKey to users.id)
   - `org_id`: str (ForeignKey to organizations.id)
   - `job_id`: Optional[str]
   - `reviewer_id`: str (ForeignKey to users.id)
   - `overall_recommendation`: str ('strong_hire', 'hire', 'neutral', 'reject')
   - `technical_rating`: int (1-5)
   - `communication_rating`: int (1-5)
   - `problem_solving_rating`: int (1-5)
   - `culture_add_rating`: int (1-5)
   - `feedback_notes`: Text
   - `created_at`: datetime
   - UniqueConstraint on `(candidate_id, org_id, reviewer_id)` for single review per reviewer
3. Create `RecruiterNote` entity:
   - `id`: str (primary key)
   - `candidate_id`: str (ForeignKey to users.id)
   - `org_id`: str (ForeignKey to organizations.id)
   - `author_id`: str (ForeignKey to users.id)
   - `note_content`: Text
   - `is_private`: bool (default True)
   - `created_at`: datetime
4. Add idempotent table creation in `seed.py`.

---

### Task 2: Real-Time WebSocket Connection Manager
**Files:**
- Create: `backend/app/services/collaboration/connection_manager.py`
- Create: `backend/app/services/collaboration/__init__.py`

**Details:**
1. Implement `HiringCollaborationManager`:
   - Active connections mapped by `org_id: Dict[WebSocket, Dict[str, Any]]` (storing user metadata: user_id, user_name, role).
   - `connect(websocket, org_id, user_data)`: registers socket, notifies existing peers (`RECRUITER_JOINED`), emits active peer count.
   - `disconnect(websocket, org_id)`: removes socket, notifies remaining peers (`RECRUITER_LEFT`).
   - `broadcast(org_id, event_type, payload)`: sends JSON message to all active sockets connected to `org_id`.
   - Ping/Pong heartbeat and exception safety on broken sockets.

---

### Task 3: Collaboration API & WebSocket Endpoints
**Files:**
- Create: `backend/app/api/v1/collaboration.py`
- Modify: `backend/app/main.py:20-100`

**Details:**
1. `websocket_endpoint("/ws/hiring/{org_id}")`:
   - Authenticates token query param or first payload.
   - Accepts socket and subscribes to tenant room.
   - Listens for client actions (`PING`, `TYPING_NOTE`, `REQUEST_PEERS`).
2. `POST /api/v1/collaboration/pipeline/move`:
   - Requires `employer` or `admin` role.
   - Records `PipelineStageChange` in database.
   - Updates candidate `pipeline_status` in DB.
   - If `to_stage` in `['interview', 'offer']`, dispatches real-time `UserNotification` to candidate.
   - Broadcasts `STAGE_CHANGED` event via `collaboration_manager`.
3. `POST /api/v1/collaboration/scorecards`:
   - Upserts reviewer scorecard (1-5 scales, recommendation, feedback).
   - Computes updated aggregated team averages (average technical, average communication, recommendation tallies).
   - Broadcasts `SCORECARD_SUBMITTED` event.
4. `GET /api/v1/collaboration/scorecards/{candidate_id}`:
   - Retrieves all scorecards for candidate within the recruiter's tenant.
   - Returns individual cards + aggregated team summary.
5. `POST /api/v1/collaboration/notes` & `GET /api/v1/collaboration/notes/{candidate_id}`:
   - Saves recruiter notes and broadcasts `NOTE_ADDED`.

---

### Task 4: Frontend Collaboration API Client & WebSocket Hook
**Files:**
- Create: `frontend/src/lib/api/collaboration.ts`
- Create: `frontend/src/lib/useCollaborationSocket.ts`
- Modify: `frontend/src/types/index.ts`

**Details:**
1. Define TypeScript contracts in `types/index.ts`:
   - `PipelineStageChangeEvent`, `CandidateScorecard`, `ScorecardSummary`, `RecruiterNote`, `CollaboratorPresence`.
2. Implement `frontend/src/lib/api/collaboration.ts`:
   - `movePipelineStage(candidateId, fromStage, toStage, reason)`
   - `submitScorecard(payload)`
   - `getScorecards(candidateId)`
   - `createNote(candidateId, content, isPrivate)`
   - `getNotes(candidateId)`
3. Implement `useCollaborationSocket(orgId, currentUser)`:
   - Manages resilient WebSocket connection to `ws://localhost:8000/ws/hiring/{orgId}`.
   - Dispatches incoming `STAGE_CHANGED` to Zustand store.
   - Exposes `isConnected`, `activeCollaborators`, `lastEvent`.

---

### Task 5: Frontend Synchronized Pipeline Kanban & Multi-Reviewer Scorecard Drawer
**Files:**
- Modify: `frontend/src/components/employer/PipelineKanban.tsx`
- Create: `frontend/src/components/employer/CandidateScorecardDrawer.tsx`
- Modify: `frontend/src/components/employer/CandidateDrawer.tsx`

**Details:**
1. In `PipelineKanban.tsx`:
   - Connect `useCollaborationSocket(currentOrg.id, user)`.
   - Add Live Collaboration status indicator in header:
     - `🟢 Live Sync Active (3 team members connected)`
   - On drag/move action, call `collaborationApi.movePipelineStage` with optimistic UI update.
2. Create `CandidateScorecardDrawer.tsx`:
   - Displays team evaluation consensus (Average Technical, Average Communication, Recommendation pie/badges).
   - Form with 1-5 star ratings for Technical, Communication, Problem Solving, Culture.
   - Recommendation toggle (`Strong Hire`, `Hire`, `Neutral`, `Reject`).
   - Private recruiter notes discussion thread.
3. Wire scorecard trigger into `CandidateDrawer.tsx` with a "Team Scorecards & Notes" tab.

---

### Task 6: 360-Degree Integration Test Suite
**Files:**
- Create: `backend/test_sprint7_collaboration_and_websockets.py`

**Details:**
1. `test_pipeline_stage_change_persistence_and_notification`:
   - Moves candidate to `interview`, verifies `PipelineStageChange` record and created `UserNotification`.
2. `test_multi_reviewer_scorecard_upsert_and_averages`:
   - Submits 2 scorecards from distinct recruiters; verifies team aggregate calculations.
3. `test_recruiter_notes_crud_and_privacy`:
   - Tests private vs public team notes scoped to tenant.
4. `test_websocket_connection_and_stage_broadcast`:
   - Connects TestClient WebSocket; sends stage move; verifies socket receives `STAGE_CHANGED` event payload.
5. `test_tenant_isolation_on_collaboration_data`:
   - Verifies Recruiter from Org A cannot access or receive WebSocket events from Org B.
6. Full regression test: verify all 109 existing tests + new Sprint 7 tests pass.

---

### Task 7: Documentation, Atomic Commits & GitHub Push
**Files:**
- Modify: `README.md`
- Push branch `feat/sprint-7-realtime-websockets-and-collaborative-hiring` to `origin`.
