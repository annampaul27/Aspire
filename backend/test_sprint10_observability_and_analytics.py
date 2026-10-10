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
