import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.telemetry import telemetry_registry


class MetricsMiddleware(BaseHTTPMiddleware):
    """
    ASGI middleware that instruments incoming HTTP requests and updates
    OpenMetrics telemetry (request counts and latency summaries).
    """

    async def dispatch(self, request: Request, call_next):
        # Avoid recording the metrics scraper itself to avoid loop skew
        if request.url.path == "/metrics":
            return await call_next(request)

        start_time = time.perf_counter()
        status_code = 500
        try:
            response: Response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception:
            status_code = 500
            raise
        finally:
            duration = time.perf_counter() - start_time
            path = request.url.path
            method = request.method

            telemetry_registry.increment_counter(
                "http_requests_total",
                value=1.0,
                labels={"method": method, "endpoint": path, "status": str(status_code)},
                description="Total HTTP requests handled by the platform",
            )
            telemetry_registry.observe_summary(
                "http_request_duration_seconds",
                value=duration,
                labels={"endpoint": path},
                description="HTTP request latency in seconds",
            )
