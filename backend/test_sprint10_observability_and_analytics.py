from app.core.telemetry import TelemetryRegistry

def test_telemetry_registry_counter_and_gauge():
    reg = TelemetryRegistry()
    reg.increment_counter("http_requests_total", 1.0, labels={"method": "GET", "status": "200"}, description="Total HTTP requests handled")
    reg.increment_counter("http_requests_total", 2.0, labels={"method": "GET", "status": "200"})
    reg.set_gauge("active_websockets", 5, labels={"org_id": "org-acme"}, description="Active WebSocket connections")
    
    output = reg.generate_prometheus_format()
    assert "# HELP http_requests_total Total HTTP requests handled" in output
    assert "# TYPE http_requests_total counter" in output
    assert 'http_requests_total{method="GET",status="200"} 3.0' in output
    assert "# HELP active_websockets Active WebSocket connections" in output
    assert "# TYPE active_websockets gauge" in output
    assert 'active_websockets{org_id="org-acme"} 5.0' in output

def test_telemetry_registry_summary_quantiles():
    reg = TelemetryRegistry()
    for duration in [0.010, 0.020, 0.030, 0.040, 0.050, 0.100, 0.200]:
        reg.observe_summary("http_request_duration_seconds", duration, labels={"endpoint": "/health"})
    
    quantiles = reg.get_summary_quantiles("http_request_duration_seconds", labels={"endpoint": "/health"})
    assert quantiles["count"] == 7
    assert quantiles["p50"] > 0.02
    assert quantiles["p99"] >= 0.10
    
    output = reg.generate_prometheus_format()
    assert 'http_request_duration_seconds{endpoint="/health",quantile="0.5"}' in output
    assert 'http_request_duration_seconds_count{endpoint="/health"} 7' in output


def test_prometheus_metrics_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    # Trigger requests to generate metrics
    health_res = client.get("/health")
    assert health_res.status_code == 200

    # Scrape /metrics endpoint
    metrics_res = client.get("/metrics")
    assert metrics_res.status_code == 200
    assert "text/plain" in metrics_res.headers["content-type"]
    assert "http_requests_total" in metrics_res.text
    assert "http_request_duration_seconds" in metrics_res.text


def test_hiring_funnel_analytics_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    res = client.get("/api/v1/analytics/hiring-funnel?org_id=org-acme")
    assert res.status_code == 200
    data = res.json()
    assert "stages" in data
    assert len(data["stages"]) == 5
    assert "conversion_rates" in data
    assert "dwell_times_hours" in data
    assert "interviewer_consensus" in data
    assert "top_deficit_skills" in data
    assert data["total_candidates"] >= 0


def test_system_telemetry_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    res = client.get("/api/v1/analytics/system-telemetry")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "p95_latency_ms" in data
    assert "active_websocket_connections" in data
    assert "uptime_seconds" in data


def test_quota_burn_rate_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    res = client.get("/api/v1/analytics/quota-burn-rate?org_id=org-acme")
    assert res.status_code == 200
    data = res.json()
    assert "plan" in data
    assert "active_jobs_used" in data
    assert "evaluations_used" in data
    assert "projected_runway_days" in data


