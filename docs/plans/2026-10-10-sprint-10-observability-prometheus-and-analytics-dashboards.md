# Sprint 10 Implementation Plan: Observability, Prometheus Metrics & Recruitment Analytics Dashboards

> **For Claude / AI Assistant:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement production-grade Prometheus OpenMetrics APM telemetry on the FastAPI backend (`/metrics`), build real-time hiring funnel & quota burn-rate analytics endpoints, and engineer an interactive, dark-mode Recruitment Funnel & System Observability dashboard on the Next.js frontend (`/employer`).

**Architecture:** A zero-heavy-dependency Python Prometheus metric collector (`app/core/telemetry.py`) integrated with an ASGI `MetricsMiddleware` tracks request latencies (P50, P90, P99), active WebSocket connection pools, code sandbox executions, and billing webhook events in standard Prometheus exposition format (`text/plain; version=0.0.4`). Dedicated analytics endpoints compute hiring conversion velocity, stage dwell times, reviewer consensus metrics, and organization quota burn rates, visualized via a reactive Next.js 15 analytics component (`RecruitmentFunnelAnalytics.tsx`).

**Tech Stack:** FastAPI, Python 3.11, OpenMetrics / Prometheus 0.0.4 text format, Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide Icons, Pytest.

---

### Task 1: Prometheus Metrics Collector & In-Memory Registry (`app/core/telemetry.py`)

**Files:**
- Create: `backend/app/core/telemetry.py`
- Test: `backend/test_sprint10_observability_and_analytics.py`

**Step 1: Write the failing test**

```python
# In backend/test_sprint10_observability_and_analytics.py
from app.core.telemetry import TelemetryRegistry

def test_telemetry_registry_counter_and_gauge():
    reg = TelemetryRegistry()
    reg.increment_counter("http_requests_total", labels={"method": "GET", "status": "200"})
    reg.set_gauge("active_websockets", 5, labels={"org_id": "org-acme"})
    
    output = reg.generate_prometheus_format()
    assert "http_requests_total{method=\"GET\",status=\"200\"} 1" in output
    assert "active_websockets{org_id=\"org-acme\"} 5" in output
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest backend/test_sprint10_observability_and_analytics.py::test_telemetry_registry_counter_and_gauge -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.core.telemetry'`

**Step 3: Write minimal implementation**

Create `backend/app/core/telemetry.py` implementing `TelemetryRegistry` with:
- Counter incrementing with arbitrary labels
- Gauge setting and incrementing/decrementing with labels
- Latency / Histogram summary recording with quantile estimation (P50, P90, P99)
- Standard OpenMetrics / Prometheus 0.0.4 text output formatter
- Singleton `metrics` instance for global access

**Step 4: Run test to verify it passes**

Run: `python -m pytest backend/test_sprint10_observability_and_analytics.py::test_telemetry_registry_counter_and_gauge -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/core/telemetry.py backend/test_sprint10_observability_and_analytics.py
git commit -m "feat(telemetry): implement in-memory prometheus metrics collector and registry"
```

---

### Task 2: ASGI Metrics Middleware & Root Prometheus Scraper Endpoint

**Files:**
- Create: `backend/app/middleware/metrics_middleware.py`
- Modify: `backend/app/main.py`
- Test: `backend/test_sprint10_observability_and_analytics.py`

**Step 1: Write the failing test**

```python
# In backend/test_sprint10_observability_and_analytics.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_prometheus_metrics_endpoint():
    # Make a test request to populate metrics
    res = client.get("/health")
    assert res.status_code == 200
    
    # Scrape /metrics
    metrics_res = client.get("/metrics")
    assert metrics_res.status_code == 200
    assert "text/plain" in metrics_res.headers["content-type"]
    assert "http_requests_total" in metrics_res.text
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest backend/test_sprint10_observability_and_analytics.py::test_prometheus_metrics_endpoint -v`
Expected: FAIL with 404 Not Found on `/metrics`

**Step 3: Write minimal implementation**

1. Create `backend/app/middleware/metrics_middleware.py`:
   - Intercepts requests, measures duration with `time.perf_counter()`, normalizes path, and logs `http_requests_total` and `http_request_duration_seconds`.
2. Update `backend/app/main.py`:
   - Add `MetricsMiddleware` to application middleware stack.
   - Expose root `@app.get("/metrics")` returning `Response(content=metrics.generate_prometheus_format(), media_type="text/plain; version=0.0.4; charset=utf-8")`.

**Step 4: Run test to verify it passes**

Run: `python -m pytest backend/test_sprint10_observability_and_analytics.py::test_prometheus_metrics_endpoint -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/middleware/metrics_middleware.py backend/app/main.py backend/test_sprint10_observability_and_analytics.py
git commit -m "feat(metrics): add asgi metrics middleware and root prometheus scrape endpoint"
```

---

### Task 3: Recruitment Funnel & Hiring Velocity API Endpoints

**Files:**
- Create: `backend/app/api/v1/analytics.py`
- Modify: `backend/app/main.py`
- Test: `backend/test_sprint10_observability_and_analytics.py`

**Step 1: Write the failing test**

```python
# In backend/test_sprint10_observability_and_analytics.py
def test_hiring_funnel_analytics_endpoint():
    res = client.get("/api/v1/analytics/hiring-funnel?org_id=org-acme")
    assert res.status_code == 200
    data = res.json()
    assert "stages" in data
    assert "total_candidates" in data
    assert "conversion_rates" in data
    assert "dwell_times_hours" in data
    assert "interviewer_consensus" in data
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest backend/test_sprint10_observability_and_analytics.py::test_hiring_funnel_analytics_endpoint -v`
Expected: FAIL with 404 Not Found

**Step 3: Write minimal implementation**

1. Create `backend/app/api/v1/analytics.py`:
   - Route `GET /api/v1/analytics/hiring-funnel`:
     - Aggregates candidate stages (Applied, Screened, Shortlisted, Interview, Offer) from relational DB and session data.
     - Calculates stage conversion percentages and realistic dwell times.
     - Calculates team reviewer consensus variance (technical vs behavioral rating correlation).
   - Route `GET /api/v1/analytics/system-telemetry`:
     - Real-time JSON telemetry: P95 latency (ms), active WebSocket nodes, total sandbox code challenges solved, and API error rate.
   - Route `GET /api/v1/analytics/quota-burn-rate`:
     - Calculates organization's quota consumption (active jobs, candidate evaluations) with burn rate projection.
2. Mount `analytics_router` in `backend/app/main.py` at `/api/v1/analytics`.

**Step 4: Run test to verify it passes**

Run: `python -m pytest backend/test_sprint10_observability_and_analytics.py::test_hiring_funnel_analytics_endpoint -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/v1/analytics.py backend/app/main.py backend/test_sprint10_observability_and_analytics.py
git commit -m "feat(analytics): implement recruitment funnel, telemetry, and quota burn-rate endpoints"
```

---

### Task 4: Frontend Analytics API Client (`frontend/src/lib/api/analytics.ts`)

**Files:**
- Create: `frontend/src/lib/api/analytics.ts`
- Modify: `frontend/src/types/index.ts` (if needed for analytics contracts)

**Step 1: Write minimal implementation**

Create `frontend/src/lib/api/analytics.ts` with strongly typed interfaces and fetchers:
- `HiringFunnelAnalyticsResponse`
- `SystemTelemetryResponse`
- `QuotaBurnRateResponse`
- Functions: `analyticsApi.getHiringFunnel()`, `analyticsApi.getSystemTelemetry()`, `analyticsApi.getQuotaBurnRate()`

**Step 2: Verify TypeScript compilation**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS with 0 errors

**Step 3: Commit**

```bash
git add frontend/src/lib/api/analytics.ts
git commit -m "feat(frontend): create analytics api client and typescript definitions"
```

---

### Task 5: Interactive Recruitment Funnel & Telemetry Dashboard (`RecruitmentFunnelAnalytics.tsx`)

**Files:**
- Create: `frontend/src/components/employer/RecruitmentFunnelAnalytics.tsx`
- Modify: `frontend/src/app/employer/page.tsx`

**Step 1: Write minimal implementation**

1. Create `frontend/src/components/employer/RecruitmentFunnelAnalytics.tsx`:
   - **Funnel Conversion Waterfall**: Interactive visual cards showing candidate transitions from Applied $\to$ Screened $\to$ Shortlisted $\to$ Interview $\to$ Offer with conversion drop-offs.
   - **Velocity & Dwell Time Matrix**: Average duration in each stage in hours/days.
   - **Team Consensus Metric**: Interviewer agreement score (high/moderate/divergent).
   - **APM System Telemetry Card**: Live P95 latency (ms), active WebSocket connections, and sandbox test executions.
   - **Quota Consumption & Burn Rate Gauge**: Jobs and candidate evaluation slots used vs subscription ceiling with refill indicators.
2. Update `frontend/src/app/employer/page.tsx`:
   - Add tab `analytics` with `BarChart3` icon: "Hiring Analytics & APM".
   - Render `<RecruitmentFunnelAnalytics />` when tab is active.

**Step 2: Run linter and typecheck**

Run: `cd frontend && npm run lint && npx tsc --noEmit`
Expected: 0 errors, 0 warnings

**Step 3: Commit**

```bash
git add frontend/src/components/employer/RecruitmentFunnelAnalytics.tsx frontend/src/app/employer/page.tsx
git commit -m "feat(employer): add interactive recruitment funnel and apm telemetry dashboard"
```

---

### Task 6: Full Monorepo Quality Gate & Verification

**Files:**
- Modify: `README.md`
- Modify: `MANUAL_TESTING_GUIDE.txt`

**Step 1: Run comprehensive tests**
1. Python static analysis: `ruff check backend/ services/` -> 0 errors
2. Python test suite: `python -m pytest backend/ services/` -> 146+ tests passed (100%)
3. Frontend lint: `cd frontend && npm run lint` -> 0 problems
4. Frontend types: `cd frontend && npx tsc --noEmit` -> 0 errors
5. Next.js production build: `cd frontend && npm run build` -> 18/18 routes statically compiled

**Step 2: Update documentation**
- Document Sprint 10 in `README.md` and `MANUAL_TESTING_GUIDE.txt` (Test Suite 11).

**Step 3: Commit and Push**
```bash
git add README.md MANUAL_TESTING_GUIDE.txt
git commit -m "docs(sprint10): document prometheus metrics, apm telemetry, and funnel analytics"
git push -u origin feat/sprint-10-observability-prometheus-and-analytics-dashboards
```
