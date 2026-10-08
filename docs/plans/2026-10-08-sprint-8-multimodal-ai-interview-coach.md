# Sprint 8 Implementation Plan: Multimodal AI Interview Coach with Video & Audio Telemetry

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-grade, multimodal AI Interview Coach equipped with real-time video gaze/composure tracking, audio speech pacing and filler-word acoustics analysis, dynamic follow-up grill questioning, and an exportable hireability scorecard—architected as an independently deployable module suitable for academic project submission and monorepo integration.

**Architecture:** 
- **Decoupled Academic Module (`services/interview_coach/`)**: Self-contained Python microservice with standalone **Streamlit App** (`streamlit_app.py`) for instantaneous 1-click cloud deployment & professor viva demonstration, FastAPI standalone runner (`standalone_app.py`), independent `requirements.txt`, Dockerfile, and academic viva documentation (`ACADEMIC_PROJECT_REPORT.md`).
- **Seamless Platform Integration**: Mountable directly into Aspire AI's main FastAPI app (`/api/v1/interview-coach/*`) and fully integrated into the Next.js frontend (`/interview-coach` and Student Dashboard).
- **Multimodal Telemetry Pipeline**:
  - **Audio Engine**: Dual STT (Web Speech API / Streamlit audio input + Groq Whisper API fallback), Neural TTS speaker, Speech Cadence Analyzer (Words Per Minute, pause ratio), and lexical Filler Word Detector (`"um"`, `"uh"`, `"like"`, `"actually"`).
  - **Vision Engine**: Real-time camera stream analysis using lightweight client-side landmark heuristics / MediaPipe / OpenCV (Eye-contact percentage, gaze deviation, head pose stability, composure index) ensuring zero GPU server costs and sub-50ms latency.
  - **Conversational Intelligence**: Dynamic LLM evaluator generating context-rich technical & behavioral questions, dynamic adaptive trap follow-ups, and a 4-dimensional composite hireability scoring matrix.

**Tech Stack:**
- Python 3.11, Streamlit, FastAPI, Pydantic v2, Groq LLM (Llama 3.3 70B), Whisper STT
- Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas API / Web Audio API / MediaStream API
- Pytest, TestClient

---

## Academic Project Architecture & Standalone Deployability

```
AI-Skill/
├── services/interview_coach/           # 🎓 STANDALONE ACADEMIC MODULE
│   ├── streamlit_app.py                # 🌟 STREAMLIT ACADEMIC APP: streamlit run streamlit_app.py
│   ├── api/
│   │   ├── routes.py                   # FastAPI router (questions, follow-ups, evaluation)
│   │   ├── audio_routes.py             # Audio ingestion, Whisper STT & acoustics telemetry
│   │   └── vision_routes.py            # Video telemetry ingestion & gaze log processor
│   ├── core/
│   │   ├── config.py                   # Autonomous configuration & Groq/Whisper credentials
│   │   ├── schemas.py                  # Pydantic v2 request/response schemas
│   │   └── scoring.py                  # Mathematical hireability composite algorithm
│   ├── engine/
│   │   ├── interviewer.py              # Multi-turn adaptive question & grill logic
│   │   ├── audio_analyzer.py           # WPM, pause ratio, filler words & tone analysis
│   │   └── vision_analyzer.py          # Eye contact ratio, head stability & composure
│   ├── static/                         # Standalone zero-dependency Web UI (for viva demo)
│   │   ├── index.html                  # Full video/audio interview interface
│   │   ├── app.js                      # MediaStream, Web Speech API & Canvas visualizer
│   │   └── styles.css                  # Responsive dark-mode styling
│   ├── tests/
│   │   └── test_standalone_coach.py    # Independent pytest suite
│   ├── Dockerfile                      # Single-container deployment
│   ├── requirements.txt                # Standalone dependencies (includes streamlit)
│   ├── run_streamlit.bat / .sh         # 🚀 1-Click Launchers: run_streamlit.bat
│   ├── standalone_app.py               # 🚀 FastAPI Launcher: python standalone_app.py (Port 8005)
│   └── ACADEMIC_PROJECT_REPORT.md      # Complete thesis/viva submission report
│
├── backend/app/api/v1/
│   └── interview_coach.py              # Platform proxy router mounting the service
│
└── frontend/src/
    ├── app/interview-coach/page.tsx    # Next.js interactive studio page
    ├── components/interview/
    │   ├── DeviceCheckModal.tsx        # Camera/Mic calibration & level check
    │   ├── LiveInterviewStage.tsx      # Video canvas, speech visualizer & real-time HUD
    │   ├── SpeechTelemetryHUD.tsx      # Live WPM, filler word counter & gaze tracker
    │   └── EvaluationReportModal.tsx   # Radar chart, rubric breakdown & PDF export
    └── lib/api/interviewCoach.ts       # Typed API client
```

---

## Mathematical Scoring Model (For Academic Paper / Viva)

The system computes a deterministic **Composite Hireability Index (CHI)** $\in [0, 100]$:

$$\text{CHI} = w_t \cdot S_{\text{tech}} + w_v \cdot S_{\text{vocal}} + w_n \cdot S_{\text{nonverbal}}$$

Where:
- $w_t = 0.50$ (Technical Content & Semantic Rubric)
- $w_v = 0.25$ (Vocal Delivery & Speech Acoustics)
- $w_n = 0.25$ (Non-Verbal Composure & Eye Contact)

1. **Technical Score ($S_{\text{tech}}$)**:
   $$S_{\text{tech}} = 0.60 \cdot \text{Accuracy} + 0.40 \cdot \text{Clarity}$$
2. **Vocal Score ($S_{\text{vocal}}$)**:
   $$S_{\text{vocal}} = 100 - (\Delta_{\text{WPM}} \times 0.5) - (\text{FillerCount} \times 4) - (\text{LongPauses} \times 5)$$
   *(Optimal WPM range: $130 - 160$ words per minute)*
3. **Non-Verbal Score ($S_{\text{nonverbal}}$)**:
   $$S_{\text{nonverbal}} = (\text{EyeContactRatio} \times 60) + (\text{HeadStabilityIndex} \times 40)$$

---

## Phased Implementation Tasks

### Task 1: Scaffolding the Standalone Academic Module & Configuration
**Files:**
- Create: `services/interview_coach/__init__.py`
- Create: `services/interview_coach/core/config.py`
- Create: `services/interview_coach/core/schemas.py`
- Create: `services/interview_coach/core/scoring.py`
- Create: `services/interview_coach/requirements.txt`
- Test: `services/interview_coach/tests/test_scoring_algorithm.py`

**Step 1: Write the failing test**
Verify that the mathematical scoring model calculates composite scores, detects penalties for excessive fillers, and normalizes out-of-bounds ratings.

**Step 2: Run test to verify it fails**
Run: `pytest services/interview_coach/tests/test_scoring_algorithm.py -v` (FAIL: module not found).

**Step 3: Implement minimal code**
Implement `config.py`, typed Pydantic schemas (`InterviewSession`, `SpeechMetrics`, `VisionMetrics`, `EvaluationReport`), and the mathematical scoring formula in `scoring.py`.

**Step 4: Run test to verify it passes**
Run: `pytest services/interview_coach/tests/test_scoring_algorithm.py -v` (PASS).

**Step 5: Commit**
`feat(interview-coach): scaffold standalone module with mathematical scoring algorithms`

---

### Task 2: Speech Acoustics & Vision Telemetry Engine
**Files:**
- Create: `services/interview_coach/engine/audio_analyzer.py`
- Create: `services/interview_coach/engine/vision_analyzer.py`
- Test: `services/interview_coach/tests/test_telemetry_analyzers.py`

**Step 1: Write the failing test**
Test audio processing: transcript word count, WPM calculation, filler-word extraction (`"uh"`, `"um"`, `"basically"`), and gaze deviation processing.

**Step 2: Run test to verify it fails**
Run: `pytest services/interview_coach/tests/test_telemetry_analyzers.py -v` (FAIL).

**Step 3: Implement minimal code**
- Implement `AudioAnalyzer`: regex-based filler word extractor, WPM timer, and audio duration normalizer.
- Implement `VisionAnalyzer`: aggregates frames of eye-contact booleans, calculates gaze stability, and penalizes sustained gaze aversion (>3 seconds).

**Step 4: Run test to verify it passes**
Run: `pytest services/interview_coach/tests/test_telemetry_analyzers.py -v` (PASS).

**Step 5: Commit**
`feat(interview-coach): implement speech acoustics and vision telemetry analyzers`

---

### Task 3: Adaptive Turn-Taking & Question Generator with Follow-up Traps
**Files:**
- Create: `services/interview_coach/engine/interviewer.py`
- Test: `services/interview_coach/tests/test_adaptive_interviewer.py`

**Step 1: Write the failing test**
Verify initial question generation for technical/behavioral roles, followed by dynamic trap generation when a response lacks architectural depth.

**Step 2: Run test to verify it fails**
Run: `pytest services/interview_coach/tests/test_adaptive_interviewer.py -v` (FAIL).

**Step 3: Implement minimal code**
- Build `AdaptiveInterviewerEngine` with Groq Llama 3.3 prompt templates and high-fidelity deterministic fallbacks.
- Include adaptive follow-up generator: detects missing constraints in the first answer and formulates a pointed 1-sentence counter-question (e.g. *"How would your caching strategy prevent cache stampede under peak load?"*).

**Step 4: Run test to verify it passes**
Run: `pytest services/interview_coach/tests/test_adaptive_interviewer.py -v` (PASS).

**Step 5: Commit**
`feat(interview-coach): add adaptive multi-turn questioning and follow-up trap logic`

---

### Task 4: Standalone FastAPI Microservice & Standalone UI
**Files:**
- Create: `services/interview_coach/api/routes.py`
- Create: `services/interview_coach/standalone_app.py`
- Create: `services/interview_coach/static/index.html`
- Create: `services/interview_coach/static/app.js`
- Create: `services/interview_coach/static/styles.css`
- Create: `services/interview_coach/Dockerfile`
- Test: `services/interview_coach/tests/test_api_endpoints.py`

**Step 1: Write the failing test**
Test REST endpoints: `/api/v1/interview/start`, `/api/v1/interview/question`, `/api/v1/interview/follow-up`, and `/api/v1/interview/evaluate`.

**Step 2: Run test to verify it fails**
Run: `pytest services/interview_coach/tests/test_api_endpoints.py -v` (FAIL).

**Step 3: Implement minimal code**
- Build FastAPI routes exposing full interview lifecycle.
- Implement `standalone_app.py` mounting routes and serving `static/` on port 8005 with CORS.
- Implement standalone HTML5/JS UI featuring camera preview, Web Speech API speech recognition, canvas audio visualizer, and live feedback metrics.

**Step 4: Run test to verify it passes**
Run: `pytest services/interview_coach/tests/test_api_endpoints.py -v` (PASS).

**Step 5: Commit**
`feat(interview-coach): build standalone fastAPI microservice and zero-dependency web interface`

---

### Task 5: Mount Router into Main Aspire AI Backend & Seed Data
**Files:**
- Create: `backend/app/api/v1/interview_coach.py`
- Modify: `backend/app/main.py`
- Test: `backend/test_interview_coach_integration.py`

**Step 1: Write the failing test**
Verify that Aspire AI's main server `/api/v1/interview-coach/*` endpoints are live, protected by role tokens, and return valid schemas.

**Step 2: Run test to verify it fails**
Run: `pytest backend/test_interview_coach_integration.py -v` (FAIL).

**Step 3: Implement minimal code**
Import the decoupled module into `backend/app/api/v1/interview_coach.py` and register in `main.py` router list.

**Step 4: Run test to verify it passes**
Run: `pytest backend/test_interview_coach_integration.py -v` (PASS).

**Step 5: Commit**
`feat(backend): mount standalone interview coach microservice into core aspire API`

---

### Task 6: Modern Next.js Interactive Studio Page & Telemetry HUD
**Files:**
- Create: `frontend/src/lib/api/interviewCoach.ts`
- Create: `frontend/src/components/interview/DeviceCheckModal.tsx`
- Create: `frontend/src/components/interview/SpeechTelemetryHUD.tsx`
- Create: `frontend/src/components/interview/LiveInterviewStage.tsx`
- Create: `frontend/src/components/interview/EvaluationReportModal.tsx`
- Create: `frontend/src/app/interview-coach/page.tsx`
- Modify: `frontend/src/app/student/page.tsx` (Add prominent "Launch AI Interview Studio" card)

**Step 1: Build components & typed contracts**
- `DeviceCheckModal`: Camera feed + mic level test with gain meter.
- `SpeechTelemetryHUD`: Live telemetry floating bar (WPM indicator, filler word badge, eye-contact tracking indicator, real-time waveform).
- `LiveInterviewStage`: Turn-based interactive stage with video feed, question prompt with TTS audio button, answer recording with live transcript, and follow-up prompt.
- `EvaluationReportModal`: Comprehensive multi-modal report with radar charts, metric breakdowns, and printable summary.

**Step 2: Verify production Next.js compilation**
Run: `npm run build` in `frontend/`
Expected: 0 errors, all routes compiled cleanly.

**Step 3: Commit**
`feat(frontend): build interactive interview coach studio with live audio/video telemetry HUD`

---

### Task 7: Academic Project Documentation & Thesis Viva Package
**Files:**
- Create: `services/interview_coach/ACADEMIC_PROJECT_REPORT.md`
- Create: `services/interview_coach/VIVA_PRESENTATION_GUIDE.md`
- Create: `services/interview_coach/start_standalone.bat` (1-click launch for Windows)
- Create: `services/interview_coach/start_standalone.sh` (1-click launch for Linux/Mac)

**Step 1: Author Academic Deliverables**
- Problem Statement, Objectives, Novelty, System Architecture, Mathematical Formulas.
- Experimental Evaluation, Accuracy Metrics, Benchmarking against human mock interviewers.
- Viva Questions & Answers: Likely examiner questions regarding WebRTC vs Web Speech, latency, privacy, and LLM hallucination safeguards.

**Step 2: Commit**
`docs(academic): add comprehensive academic project report, viva guide, and standalone launch scripts`

---

### Task 8: 360-Degree Regression Testing & README Milestone Update
**Files:**
- Modify: `README.md`
- Modify: `MANUAL_TESTING_GUIDE.txt`

**Step 1: Run full regression test suite**
Run: `pytest backend services/interview_coach/tests -v`
Expected: 100% pass rate across all test modules.

**Step 2: Verify Next.js build**
Run: `npm run build` in `frontend/`

**Step 3: Update documentation & commit**
Update `README.md` with Sprint 8 completed milestone, updated badges, architecture tree, and contributor attribution.
`docs: update readme and manual testing guide with sprint 8 multimodal interview coach`
