import os
from typing import Optional

from app.services.sandbox.base import BaseSandboxRunner
from app.services.sandbox.database_runner import EphemeralDatabaseRunner
from app.services.sandbox.python_runner import IsolatedPythonRunner
from app.services.sandbox.judge0_runner import Judge0SandboxRunner


class SandboxRunnerFactory:
    """
    Factory that instantiates the appropriate execution runner based on challenge type,
    language specification, and environment configuration.
    """

    @classmethod
    def get_runner(
        cls,
        challenge_id: str,
        language: Optional[str] = None
    ) -> BaseSandboxRunner:
        c_id = (challenge_id or "").lower()
        lang = (language or "").lower()

        # Check for remote Judge0 / Container cluster toggle
        use_remote_judge = os.environ.get("USE_JUDGE0_SANDBOX", "false").lower() in ("true", "1", "yes")
        if use_remote_judge:
            return Judge0SandboxRunner()

        # Database / SQL indexing challenges
        if "db-" in c_id or "sql" in c_id or "postgres" in c_id or lang == "sql":
            return EphemeralDatabaseRunner(row_count=50000)

        # Default: Process-isolated Python runner with timeout cap
        return IsolatedPythonRunner(timeout_seconds=3.0)
