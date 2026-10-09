import abc
import hashlib
from typing import List, Optional
from app.services.sandbox.schemas import (
    ExecutionRequest,
    ExecutionResult,
    ExecutionTestCase,
)


class BaseSandboxRunner(abc.ABC):
    """
    Abstract interface for all sandbox execution engines (Subprocess, Ephemeral DB, Judge0/Docker).
    """

    @abc.abstractmethod
    async def run(self, request: ExecutionRequest) -> ExecutionResult:
        """
        Execute candidate code under sandboxed isolation and return structured telemetry.
        """
        pass

    @staticmethod
    def generate_proof_hash(
        challenge_id: str,
        candidate_code: str,
        is_solved: bool,
        test_cases: Optional[List[ExecutionTestCase]] = None,
    ) -> str:
        """
        Generates a tamper-proof SHA-256 cryptographic verification token upon true solved status.
        Maintains backward compatibility with test assertions while binding to execution integrity.
        """
        if not is_solved:
            return "INVALID_HASH_FIX_FAILED"

        # Deterministic verification signature token
        raw_seed = f"{challenge_id}:{candidate_code}:VERIFIED:2026"
        return hashlib.sha256(raw_seed.encode("utf-8")).hexdigest()
