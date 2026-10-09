import uuid
import re
from typing import Optional, Dict, Any
from services.interview_coach.core.config import settings
from services.interview_coach.core.schemas import (
    InterviewQuestionResponse,
    FollowUpProbeResponse,
    HireabilityEvaluationReport,
    AnswerSubmissionRequest,
)
from services.interview_coach.core.scoring import (
    calculate_technical_score,
    calculate_vocal_score,
    calculate_nonverbal_score,
    calculate_composite_hireability,
    classify_hireability_verdict,
)
from services.interview_coach.engine.audio_analyzer import AudioAcousticsAnalyzer
from services.interview_coach.engine.vision_analyzer import VisionTelemetryAnalyzer

class AdaptiveInterviewerEngine:
    """
    Adaptive Conversational AI Interview Engine:
    - Generates context-rich technical & behavioral interview scenarios.
    - Generates adaptive trap follow-up probes based on incomplete candidate answers.
    - Synthesizes technical, vocal acoustics, and non-verbal telemetry into a composite hireability report.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.audio_analyzer = AudioAcousticsAnalyzer()
        self.vision_analyzer = VisionTelemetryAnalyzer()

    def generate_question(
        self,
        role: str = "Senior Backend Engineer",
        topic: str = "Distributed Systems & Partitioning",
        difficulty: str = "senior",
    ) -> InterviewQuestionResponse:
        """
        Generates an interview scenario with expected keywords, hints, and potential follow-up traps.
        """
        clean_role = role.strip() or "Senior Software Engineer"
        clean_topic = topic.strip() or "System Architecture"
        clean_difficulty = difficulty.lower()

        if self.api_key:
            try:
                import instructor
                from groq import Groq
                client = instructor.from_groq(Groq(api_key=self.api_key), mode=instructor.Mode.JSON)
                prompt = f"""
                You are a Principal Engineering Bar-Raiser conducting a {clean_difficulty}-level interview for a {clean_role}.
                Topic: {clean_topic}

                Requirements:
                - Generate a concrete, realistic architectural scenario or behavioral challenge question.
                - List 4-6 critical technical keywords expected in a top response.
                - Provide 2 actionable technical hints.
                - Provide 2 trap follow-up grilling questions that probe edge cases if the candidate is superficial.
                """
                resp = client.chat.completions.create(
                    model=self.model,
                    response_model=InterviewQuestionResponse,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                )
                resp.role = clean_role
                resp.topic = clean_topic
                resp.difficulty = clean_difficulty
                if not resp.question_id:
                    resp.question_id = f"q-{uuid.uuid4().hex[:8]}"
                return resp
            except Exception as e:
                print(f"[AdaptiveInterviewer] Groq question error: {e}, using deterministic fallback.")

        return self._deterministic_generate_question(clean_role, clean_topic, clean_difficulty)

    def generate_follow_up_probe(
        self,
        question_text: str,
        candidate_answer: str,
        role: str = "Senior Software Engineer"
    ) -> FollowUpProbeResponse:
        """
        Analyzes the initial candidate response, finds weak points/omissions,
        and generates a pointed counter-probe question.
        """
        clean_q = question_text.strip()
        clean_a = candidate_answer.strip()

        if self.api_key:
            try:
                import instructor
                from groq import Groq
                client = instructor.from_groq(Groq(api_key=self.api_key), mode=instructor.Mode.JSON)
                prompt = f"""
                You are an elite Technical Hiring Manager interviewing a candidate for {role}.
                
                Initial Scenario:
                "{clean_q}"
                
                Candidate's Answer:
                "{clean_a}"
                
                Formulate a sharp, 1-2 sentence follow-up probe that grills an unaddressed trade-off, edge case, or potential failure mode in their answer.
                """
                resp = client.chat.completions.create(
                    model=self.model,
                    response_model=FollowUpProbeResponse,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                )
                if not resp.probe_id:
                    resp.probe_id = f"probe-{uuid.uuid4().hex[:8]}"
                return resp
            except Exception as e:
                print(f"[AdaptiveInterviewer] Groq follow-up error: {e}, using deterministic fallback.")

        return self._deterministic_generate_follow_up(clean_q, clean_a, role)

    def evaluate_session(self, req: AnswerSubmissionRequest) -> HireabilityEvaluationReport:
        """
        Multimodal synthesis: evaluates technical transcript, speech acoustics, and vision telemetry.
        """
        # 1. Compute vocal acoustics
        speech_metrics = self.audio_analyzer.analyze_transcript(
            req.candidate_transcript,
            duration_seconds=req.audio_duration_seconds
        )
        vocal_score = calculate_vocal_score(speech_metrics)

        # 2. Compute vision telemetry
        vision_metrics = self.vision_analyzer.analyze_metrics(
            eye_contact_ratio=req.eye_contact_ratio,
            head_stability_index=req.head_stability_score,
            gaze_deviations=int(max(0, (1.0 - req.eye_contact_ratio) * 10))
        )
        nonverbal_score = calculate_nonverbal_score(vision_metrics)

        # 3. Evaluate technical transcript
        tech_eval = self._evaluate_technical_content(req.question_text, req.candidate_transcript, req.role)
        tech_score = calculate_technical_score(tech_eval["accuracy"], tech_eval["clarity"])

        # 4. Compute Composite Hireability Index (CHI)
        chi = calculate_composite_hireability(tech_score, vocal_score, nonverbal_score)
        verdict = classify_hireability_verdict(chi)

        # 5. Build Radar Chart dimensions
        radar_chart_data = {
            "Technical Accuracy": round(tech_eval["accuracy"], 1),
            "System Architecture": round(tech_score, 1),
            "Vocal Cadence": round(vocal_score, 1),
            "Non-Verbal Poise": round(nonverbal_score, 1),
            "Communication Clarity": round(tech_eval["clarity"], 1),
        }

        return HireabilityEvaluationReport(
            report_id=f"rep-{uuid.uuid4().hex[:10]}",
            candidate_name="Candidate",
            role=req.role,
            topic=req.question_text[:60] + "...",
            overall_hireability_score=chi,
            verdict=verdict,
            technical_score=tech_score,
            vocal_score=vocal_score,
            nonverbal_score=nonverbal_score,
            speech_metrics=speech_metrics,
            vision_metrics=vision_metrics,
            rubric_breakdown={
                "accuracy": round(tech_eval["accuracy"], 1),
                "clarity": round(tech_eval["clarity"], 1),
                "vocal_pacing": round(vocal_score, 1),
                "gaze_composure": round(nonverbal_score, 1),
            },
            what_went_well=tech_eval["what_went_well"],
            what_to_improve=tech_eval["what_to_improve"],
            model_senior_response=tech_eval["model_senior_response"],
            radar_chart_data=radar_chart_data,
        )

    # -------------------------------------------------------------------------
    # Deterministic Fallback Logic
    # -------------------------------------------------------------------------

    def _deterministic_generate_question(
        self,
        role: str,
        topic: str,
        difficulty: str
    ) -> InterviewQuestionResponse:
        topic_lower = topic.lower()
        if "database" in topic_lower or "sql" in topic_lower or "index" in topic_lower or "mvcc" in topic_lower:
            return InterviewQuestionResponse(
                question_id="q-db-01",
                role=role,
                topic=topic,
                difficulty=difficulty,
                question_scenario=(
                    "How would you diagnose and optimize a severe slow-query regression in a high-concurrency "
                    "PostgreSQL cluster without taking blocking exclusive locks on production tables?"
                ),
                hints=[
                    "Consider utilizing EXPLAIN (ANALYZE, BUFFERS) and pg_stat_activity.",
                    "Address index creation using the CONCURRENTLY modifier."
                ],
                expected_keywords=["EXPLAIN ANALYZE", "CONCURRENTLY", "B-Tree", "MVCC vacuum", "connection pooling"],
                follow_up_traps=[
                    "What happens to autovacuum workers if a transaction stays open during concurrent index creation?",
                    "How would you handle query plan invalidation when table statistics drift?"
                ]
            )
        elif "cache" in topic_lower or "redis" in topic_lower:
            return InterviewQuestionResponse(
                question_id="q-cache-01",
                role=role,
                topic=topic,
                difficulty=difficulty,
                question_scenario=(
                    "How would you architect a distributed caching layer that protects the underlying database "
                    "from cache stampedes and thundering herds when a high-traffic key expires?"
                ),
                hints=[
                    "Look into probabilistic early expiration (XFetch) or mutex locking.",
                    "Discuss pre-warming and separate read-through mechanisms."
                ],
                expected_keywords=["cache stampede", "distributed lock", "mutex", "TTL jitter", "read-through"],
                follow_up_traps=[
                    "How do you handle lock release if the worker node crashes midway through regenerating the cache?",
                    "Would you choose Redis Sentinel or Cluster for high-availability partition recovery?"
                ]
            )
        else:
            return InterviewQuestionResponse(
                question_id="q-dist-01",
                role=role,
                topic=topic,
                difficulty=difficulty,
                question_scenario=(
                    f"In a {role} environment handling {topic}, how would you architect a resilient, "
                    "fault-tolerant asynchronous processing pipeline that guarantees exactly-once semantics "
                    "or idempotent execution under network partitions?"
                ),
                hints=[
                    "Discuss distributed transactions vs. transactional outbox pattern.",
                    "Address consumer offset management and dead-letter queues."
                ],
                expected_keywords=["idempotency key", "transactional outbox", "dead-letter queue", "backpressure", "consensus"],
                follow_up_traps=[
                    "If consumer acknowledgement fails after writing to the database, how do you prevent duplicated side effects?",
                    "How does your schema design guarantee idempotent deduplication at scale?"
                ]
            )

    def _deterministic_generate_follow_up(
        self,
        question_text: str,
        candidate_answer: str,
        role: str
    ) -> FollowUpProbeResponse:
        ans_lower = candidate_answer.lower()
        if "cache" in ans_lower or "redis" in ans_lower:
            return FollowUpProbeResponse(
                probe_id="probe-cache-01",
                probe_question=(
                    "You mentioned using Redis caching, but what happens during a cache stampede if thousands of "
                    "concurrent requests hit the expired key simultaneously before it is regenerated?"
                ),
                probe_focus="Concurrency & Cache Stampede Mitigations",
                hint="Mention distributed mutex locking (Redlock) or probabilistic early recomputation."
            )
        elif "kafka" in ans_lower or "queue" in ans_lower:
            return FollowUpProbeResponse(
                probe_id="probe-queue-01",
                probe_question=(
                    "How do you ensure message processing remains strictly ordered if a specific partitioned batch "
                    "fails repeatedly and triggers your dead-letter retry mechanism?"
                ),
                probe_focus="Partition Ordering & Retry Backpressure",
                hint="Discuss poison-pill routing vs head-of-line blocking."
            )
        else:
            return FollowUpProbeResponse(
                probe_id="probe-general-01",
                probe_question=(
                    "That handles the happy path, but what specific rollback or compensation mechanism executes "
                    "if a downstream microservice experiences a catastrophic network timeout midway through the operation?"
                ),
                probe_focus="Distributed Failure Modes & Saga Orchestration",
                hint="Address saga compensation transactions or two-phase commit trade-offs."
            )

    def _evaluate_technical_content(
        self,
        question: str,
        answer: str,
        role: str
    ) -> Dict[str, Any]:
        """Evaluates semantic depth, accuracy, and clarity deterministically."""
        words = re.findall(r'\b\w+\b', answer)
        word_count = len(words)

        # Baseline accuracy by word density and domain keyword coverage
        domain_signals = [
            "distributed", "kafka", "redis", "postgres", "sql", "index", "concurrency",
            "idempotency", "outbox", "dead-letter", "replication", "partition",
            "acid", "mvcc", "quorum", "consensus", "lock", "queue", "cache"
        ]
        signals_found = sum(1 for s in domain_signals if s in answer.lower())

        if word_count < 15:
            accuracy = 35.0
            clarity = 40.0
            well = ["Candidate provided an initial response."]
            improve = ["Answer is severely lacking technical substance, edge cases, and architectural justification."]
        elif signals_found >= 4 and word_count >= 30:
            accuracy = min(96.0, 75.0 + (signals_found * 4.0))
            clarity = min(92.0, 72.0 + (word_count * 0.35))
            well = [
                "Articulated clear distributed systems principles with accurate domain terminology.",
                "Demonstrated awareness of failure boundaries, idempotency, and asynchronous reliability."
            ]
            improve = [
                "Could provide deeper quantitative trade-off metrics (e.g. latency impact under high P99 load)."
            ]
        elif signals_found >= 2:
            accuracy = 72.0
            clarity = 70.0
            well = [
                "Identified primary technologies and standard architectural components.",
                "Structured the response logically from producer to consumer."
            ]
            improve = [
                "Clarify recovery mechanisms during partial node network partitions.",
                "Explain how edge-case race conditions are prevented in concurrent scenarios."
            ]
        else:
            accuracy = 55.0
            clarity = 60.0
            well = ["Presented a basic high-level approach."]
            improve = [
                "Lacks specific technical depth and concrete implementation mechanisms.",
                "Incorporate enterprise patterns such as transactional outbox or distributed consensus."
            ]

        model_response = (
            f"As a Senior {role}, an ideal response would establish: 1) Concrete persistence guarantees "
            "(e.g., replication factor 3 with quorum write acknowledgements), 2) Idempotent consumer design "
            "using unique transaction keys to guard against duplicates, 3) Dead-letter queues with exponential backoff "
            "for poison-pill isolation, and 4) Observable distributed tracing with OpenTelemetry."
        )

        return {
            "accuracy": round(accuracy, 1),
            "clarity": round(clarity, 1),
            "what_went_well": well,
            "what_to_improve": improve,
            "model_senior_response": model_response,
        }
