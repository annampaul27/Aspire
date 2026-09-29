import os
import re
import uuid
from typing import Optional, List, Dict, Any
from app.core.config import settings
from app.services.interview.schemas import (
    InterviewQuestionSchema,
    InterviewEvaluationRubric,
)

class InterviewCoachEvaluator:
    """
    Dual-Execution AI Interview Evaluator (NF2 Resilient Dual Execution):
    - Connects to Groq LLM via Instructor for structured question generation & rubric evaluation.
    - Gracefully falls back to high-fidelity deterministic semantic analysis when offline or unconfigured.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        self.model = getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile") or "llama-3.3-70b-versatile"

    def generate_question(self, role: str, topic: str) -> InterviewQuestionSchema:
        """
        Generates a tailored technical interview question with hints and expected keywords.
        """
        clean_role = role.strip() if role else "Senior Backend Engineer"
        clean_topic = topic.strip() if topic else "Distributed Systems & Scalability"

        if self.api_key:
            try:
                import instructor
                from groq import Groq
                client = instructor.from_groq(Groq(api_key=self.api_key), mode=instructor.Mode.JSON)
                prompt = f"""
                You are a Principal Engineering Bar-Raiser at a top-tier tech company.
                Generate a challenging, real-world technical interview scenario for a {clean_role} candidate.
                Topic: {clean_topic}
                
                Requirements:
                - Provide a concrete architectural or systems design scenario question (not a generic trivia question).
                - List 3-6 critical architectural or domain keywords expected in a senior response.
                - Provide exactly 2 actionable, technical hints that guide architectural trade-offs.
                - Assign a unique question ID (e.g. q-topic-01).
                """
                response = client.chat.completions.create(
                    model=self.model,
                    response_model=InterviewQuestionSchema,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                )
                response.role = clean_role
                response.topic = clean_topic
                return response
            except Exception as e:
                print(f"[InterviewCoach] Groq generation warning: {e}, using deterministic fallback.")

        return self._deterministic_generate_question(clean_role, clean_topic)

    def evaluate_answer(
        self,
        question_text: str,
        candidate_answer: str,
        role: Optional[str] = None
    ) -> InterviewEvaluationRubric:
        """
        Evaluates candidate response across Clarity, Technical Accuracy, and Confidence.
        """
        clean_question = question_text.strip()
        clean_answer = candidate_answer.strip()
        target_role = role or "Software Engineer"

        if self.api_key:
            try:
                import instructor
                from groq import Groq
                client = instructor.from_groq(Groq(api_key=self.api_key), mode=instructor.Mode.JSON)
                prompt = f"""
                You are a Lead Technical Interview Evaluator assessing a candidate for a {target_role} position.
                
                Interview Question:
                "{clean_question}"
                
                Candidate's Answer:
                "{clean_answer}"
                
                Evaluate the response strictly according to this rubric:
                1. Technical Accuracy (0.0 - 100.0): Depth of domain principles, edge cases, system trade-offs.
                2. Clarity (0.0 - 100.0): Structure, conciseness, absence of rambling or filler.
                3. Confidence Estimate (0.0 - 1.0): Authoritative tone, decisive engineering choices, avoidance of hedging.
                4. Overall Score (0.0 - 100.0): Weighted composite formula = (technical_accuracy * 0.50) + (clarity * 0.35) + (confidence * 15.0).
                5. What Went Well: 2-3 specific, honest bullet points highlighting correct concepts the candidate mentioned.
                6. What To Improve: 1-3 actionable engineering gaps, missing constraints, or neglected trade-offs.
                7. Better Answer: A senior-level model response illustrating ideal technical depth and precision.
                8. Strengths: 2-4 key technical competencies shown.
                9. Recommended Topics: 2-3 specific follow-up study areas.
                """
                response = client.chat.completions.create(
                    model=self.model,
                    response_model=InterviewEvaluationRubric,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                )
                # Ensure overall_score consistency
                expected_score = round(
                    (response.technical_accuracy * 0.50) +
                    (response.clarity * 0.35) +
                    (response.confidence_estimate * 15.0),
                    1
                )
                response.overall_score = min(100.0, max(0.0, expected_score))
                return response
            except Exception as e:
                print(f"[InterviewCoach] Groq evaluation warning: {e}, using deterministic rubric fallback.")

        return self._deterministic_evaluate_answer(clean_question, clean_answer, target_role)

    def _deterministic_generate_question(self, role: str, topic: str) -> InterviewQuestionSchema:
        """
        High-fidelity deterministic question templates matching industry bar-raiser rubrics.
        """
        topic_lower = topic.lower()
        role_lower = role.lower()

        if any(k in topic_lower for k in ["partition", "distributed", "raft", "consensus", "consistency", "cap"]):
            return InterviewQuestionSchema(
                question_id="q-dist-01",
                question_text=f"How would you architect a fault-tolerant, low-latency microservices pipeline in a {role} scenario when network partitions occur?",
                expected_keywords=["CAP theorem", "split-brain", "quorum consensus", "idempotency", "backpressure"],
                hints=[
                    "Consider trade-offs between availability and strict consistency under network partitions.",
                    "Discuss consensus mechanisms (e.g. Raft) and asynchronous dead-letter queues."
                ],
                role=role,
                topic=topic
            )
        elif any(k in topic_lower for k in ["postgres", "database", "sql", "index", "mvcc", "query"]):
            return InterviewQuestionSchema(
                question_id="q-db-01",
                question_text=f"How do you diagnose and resolve a severe slow-query regression in a high-concurrency PostgreSQL cluster without causing blocking table locks?",
                expected_keywords=["EXPLAIN ANALYZE", "B-Tree vs GIN index", "MVCC bloat", "CONCURRENTLY", "connection pooling"],
                hints=[
                    "Analyze buffer cache hit ratios and sequential scan penalties on large tables.",
                    "Utilize CREATE INDEX CONCURRENTLY and analyze pg_stat_statements telemetry."
                ],
                role=role,
                topic=topic
            )
        elif any(k in topic_lower for k in ["docker", "k8s", "kubernetes", "devops", "cloud", "infra"]):
            return InterviewQuestionSchema(
                question_id="q-devops-01",
                question_text=f"In a production Kubernetes environment for {role}, how do you implement zero-downtime canary deployments while enforcing zero-trust mTLS service mesh policies?",
                expected_keywords=["Canary deployment", "Horizontal Pod Autoscaler (HPA)", "mTLS", "Istio/Linkerd", "Readiness probes"],
                hints=[
                    "Differentiate between liveness probes and graceful draining during pod termination.",
                    "Explain traffic-splitting using service mesh virtual services or ingress routing."
                ],
                role=role,
                topic=topic
            )
        elif any(k in topic_lower for k in ["ai", "rag", "llm", "vector", "embedding"]):
            return InterviewQuestionSchema(
                question_id="q-rag-01",
                question_text=f"How would you optimize vector retrieval latency and recall for an enterprise RAG assistant serving millions of technical documents?",
                expected_keywords=["HNSW indexing", "hybrid sparse-dense search", "chunking strategy", "re-ranking", "context window budget"],
                hints=[
                    "Discuss trade-offs between precision, latency, and index memory footprint with HNSW versus IVFFlat.",
                    "Explain how cross-encoder re-ranking improves top-k context relevancy before LLM prompting."
                ],
                role=role,
                topic=topic
            )
        elif any(k in topic_lower or k in role_lower for k in ["react", "next", "frontend"]):
            return InterviewQuestionSchema(
                question_id="q-fe-01",
                question_text=f"How do you optimize initial page load (LCP) and avoid hydration mismatches in Next.js Server Components for a data-dense dashboard?",
                expected_keywords=["Server Components", "Streaming SSR", "Suspense boundary", "Hydration mismatch", "Bundle splitting"],
                hints=[
                    "Contrast client-side state hooks with async server component data fetching.",
                    "Explain progressive hydration and streaming with React Suspense."
                ],
                role=role,
                topic=topic
            )
        else:
            return InterviewQuestionSchema(
                question_id=f"q-{uuid.uuid4().hex[:6]}",
                question_text=f"In your capacity as a {role}, how do you approach system performance, resilience, and trade-offs when tackling {topic}?",
                expected_keywords=["Scalability", "Fault tolerance", "Observability", "Trade-off analysis", "Automated testing"],
                hints=[
                    "Frame your solution in terms of latency, availability, and failure isolation.",
                    "Highlight how you validate system behavior with monitoring and metrics."
                ],
                role=role,
                topic=topic
            )

    def _deterministic_evaluate_answer(
        self,
        question_text: str,
        candidate_answer: str,
        role: str
    ) -> InterviewEvaluationRubric:
        """
        Semantic rule-based grading rubric:
        Computes authentic clarity, technical accuracy, and confidence metrics directly
        from candidate response vocabulary, structural depth, and engineering specificity.
        """
        words = candidate_answer.split()
        word_count = len(words)
        answer_lower = candidate_answer.lower()

        # 1. Technical Accuracy Scoring (0 - 100)
        # Evaluates domain-specific engineering vocabulary & depth
        TECHNICAL_KEYWORDS = [
            "cap theorem", "split-brain", "raft", "paxos", "consensus", "quorum",
            "linearizability", "eventual consistency", "idempotency", "backpressure",
            "circuit breaker", "retry", "dead-letter", "index", "b-tree", "gin",
            "explain analyze", "mvcc", "acid", "replication", "sharding", "partition",
            "connection pool", "connection pooling", "tcp", "overhead", "handshake", "socket",
            "database connection", "cache", "redis", "latency", "throughput", "p99",
            "profiling", "concurrency", "async", "goroutine", "docker", "kubernetes",
            "pod", "mtls", "ingress", "canary", "zero-downtime", "vector", "hnsw",
            "embedding", "chunking", "server components", "suspense", "hydration",
            "streaming", "memory leak"
        ]
        
        matches = [kw for kw in TECHNICAL_KEYWORDS if kw in answer_lower]
        keyword_density = len(matches)

        if word_count < 15:
            if keyword_density >= 2:
                # Concise, highly technical and accurate answer
                tech_acc = min(92.0, 75.0 + (keyword_density * 5.0))
            else:
                # Answer is excessively shallow or lacks technical terms
                tech_acc = min(55.0, 30.0 + (keyword_density * 8.0))
        elif word_count < 40:
            tech_acc = min(88.0, 56.0 + (keyword_density * 7.0))
        else:
            tech_acc = min(96.0, 68.0 + (keyword_density * 5.0))

        # 2. Clarity Scoring (0 - 100)
        # Evaluates sentence structure, brevity, and coherent explanation flow
        sentences = [s.strip() for s in re.split(r"[.!?]", candidate_answer) if s.strip()]
        avg_sentence_len = word_count / max(1, len(sentences))
        
        if word_count < 15:
            clarity = 86.0 if keyword_density >= 2 else 50.0
        elif 8 <= avg_sentence_len <= 25:
            # Well-balanced sentence length
            clarity = min(95.0, 75.0 + min(20.0, len(sentences) * 5.0))
        elif avg_sentence_len > 35:
            # Overly run-on sentences
            clarity = max(60.0, 85.0 - (avg_sentence_len - 35) * 1.5)
        else:
            clarity = 80.0

        # 3. Confidence Estimate (0.0 - 1.0)
        # Assesses authoritative phrasing vs hesitation markers
        HESITANT_MARKERS = ["maybe", "i guess", "probably", "i think", "not sure", "might be", "perhaps", "could be wrong"]
        AUTHORITATIVE_MARKERS = ["i implement", "i design", "we enforce", "guarantees", "specifically", "critical", "trade-off", "architected"]

        hesitations = sum(1 for h in HESITANT_MARKERS if h in answer_lower)
        authoritative = sum(1 for a in AUTHORITATIVE_MARKERS if a in answer_lower)

        base_confidence = 0.85
        base_confidence -= hesitations * 0.10
        base_confidence += authoritative * 0.05
        if word_count < 15:
            base_confidence -= 0.25
        confidence = round(min(0.98, max(0.40, base_confidence)), 2)

        # 4. Overall Weighted Score: (accuracy * 0.50) + (clarity * 0.35) + (confidence * 15.0)
        overall_score = round((tech_acc * 0.50) + (clarity * 0.35) + (confidence * 15.0), 1)
        overall_score = min(98.0, max(35.0, overall_score))

        # 5. Context-Aware Feedback Bullets
        what_went_well = []
        if matches:
            top_kw = [m.title() for m in matches[:3]]
            what_went_well.append(f"Demonstrated solid command of core architectural concepts: {', '.join(top_kw)}.")
        if confidence >= 0.80:
            what_went_well.append("Communicated engineering trade-offs decisively with clear, authoritative terminology.")
        if word_count >= 30 and clarity >= 80.0:
            what_went_well.append("Structured the explanation systematically from problem definition to operational safeguard.")
        if not what_went_well:
            what_went_well.append("Directly addressed the technical premise of the question.")

        what_to_improve = []
        if word_count < 30:
            what_to_improve.append("Elaborate on production failure modes and specific operational verification steps.")
        if keyword_density < 2:
            what_to_improve.append("Incorporate explicit systems trade-offs (e.g. latency vs. consistency, read vs. write amplification).")
        if hesitations > 0:
            what_to_improve.append("Avoid tentative hedging phrases ('maybe', 'I guess') when presenting architectural decisions.")
        if not what_to_improve:
            what_to_improve.append("Quantify target latency metrics (e.g. P99 thresholds) and observability telemetry in the final architecture.")

        better_answer = (
            f"A staff-level response directly addresses the operational constraints of '{question_text[:65]}...'. "
            "It begins by defining the fault model, selects an appropriate consensus or indexing strategy with concrete trade-offs, "
            "and establishes telemetry verification (e.g. P99 latency bounds, EXPLAIN ANALYZE execution traces, circuit breaker thresholds) "
            "to guarantee automated failure isolation in production."
        )

        strengths = [m.title() for m in matches[:4]] if matches else ["Systems Architecture", "Engineering Reasoning"]
        recommended_topics = ["Distributed Failure Modes & Chaos Testing", "High-Throughput Database Optimization", "Production Telemetry & Observability"]

        return InterviewEvaluationRubric(
            clarity=round(clarity, 1),
            technical_accuracy=round(tech_acc, 1),
            confidence_estimate=confidence,
            overall_score=overall_score,
            what_went_well=what_went_well,
            what_to_improve=what_to_improve,
            better_answer=better_answer,
            strengths=strengths,
            recommended_topics=recommended_topics[:2]
        )
