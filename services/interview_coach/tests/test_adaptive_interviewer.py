import pytest
from services.interview_coach.engine.interviewer import AdaptiveInterviewerEngine
from services.interview_coach.core.schemas import (
    InterviewQuestionResponse,
    FollowUpProbeResponse,
    HireabilityEvaluationReport,
    AnswerSubmissionRequest,
)

def test_interviewer_generates_structured_question():
    engine = AdaptiveInterviewerEngine(api_key=None)  # deterministic mode
    q = engine.generate_question(
        role="Senior Backend Engineer",
        topic="Database Indexing & MVCC",
        difficulty="senior"
    )
    assert isinstance(q, InterviewQuestionResponse)
    assert "Database Indexing" in q.topic or "Senior Backend" in q.role
    assert len(q.expected_keywords) >= 3
    assert len(q.hints) >= 1
    assert len(q.follow_up_traps) >= 1

def test_interviewer_generates_adaptive_follow_up_probe():
    engine = AdaptiveInterviewerEngine(api_key=None)
    question = "How would you handle cache stampede for a hot e-commerce product during flash sale?"
    answer = "We will put Redis in front of the database and set a TTL of 5 minutes on the product key."
    probe = engine.generate_follow_up_probe(question, answer, role="Senior Backend Engineer")
    assert isinstance(probe, FollowUpProbeResponse)
    assert len(probe.probe_question) > 20
    assert "stampede" in probe.probe_question.lower() or "cache" in probe.probe_question.lower() or "lock" in probe.probe_question.lower() or "ttl" in probe.probe_question.lower()

def test_interviewer_evaluates_multimodal_session():
    engine = AdaptiveInterviewerEngine(api_key=None)
    req = AnswerSubmissionRequest(
        question_id="q-test-1",
        role="Senior Backend Engineer",
        question_text="How do you ensure zero data loss in a distributed message processing system?",
        candidate_transcript=(
            "We use Kafka with a replication factor of three and set min.insync.replicas to two. "
            "On the consumer side, we use manual offset commits after successfully processing "
            "the batch, and write failed records to a dead-letter queue with exponential backoff."
        ),
        audio_duration_seconds=18.0,
        eye_contact_ratio=0.88,
        head_stability_score=90.0,
        is_follow_up=False,
    )
    report = engine.evaluate_session(req)
    assert isinstance(report, HireabilityEvaluationReport)
    assert 75.0 <= report.overall_hireability_score <= 100.0
    assert report.verdict in ["Strong Hire", "Hire"]
    assert report.technical_score >= 80.0
    assert report.vocal_score >= 80.0
    assert report.nonverbal_score >= 80.0
    assert len(report.what_went_well) >= 2
    assert len(report.what_to_improve) >= 1
    assert len(report.model_senior_response) > 50
    assert "Technical Accuracy" in report.radar_chart_data
    assert "Vocal Cadence" in report.radar_chart_data
    assert "Non-Verbal Poise" in report.radar_chart_data
