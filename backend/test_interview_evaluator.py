import pytest
from app.services.interview.evaluator import InterviewCoachEvaluator
from app.services.interview.schemas import InterviewQuestionSchema, InterviewEvaluationRubric

def test_evaluator_generates_contextual_questions():
    evaluator = InterviewCoachEvaluator()
    
    # Test distributed systems topic
    q1 = evaluator.generate_question(role="Senior Backend Engineer", topic="Distributed Systems & Partitioning")
    assert isinstance(q1, InterviewQuestionSchema)
    assert q1.question_id is not None
    assert "network partition" in q1.question_text.lower() or "microservices" in q1.question_text.lower()
    assert len(q1.expected_keywords) >= 3
    assert len(q1.hints) == 2

    # Test database tuning topic
    q2 = evaluator.generate_question(role="Staff Database Engineer", topic="PostgreSQL Index Tuning & MVCC")
    assert "postgresql" in q2.question_text.lower() or "query" in q2.question_text.lower()
    assert any("index" in kw.lower() or "explain" in kw.lower() for kw in q2.expected_keywords)

def test_evaluator_scores_dynamically_based_on_answer_quality():
    evaluator = InterviewCoachEvaluator()
    question = "How would you architect a fault-tolerant microservices pipeline when network partitions occur?"
    
    # 1. Weak, hesitant, shallow response
    weak_answer = "Maybe I guess I would restart the servers and try again."
    eval_weak = evaluator.evaluate_answer(question_text=question, candidate_answer=weak_answer)
    
    assert isinstance(eval_weak, InterviewEvaluationRubric)
    assert eval_weak.overall_score < 70.0
    assert eval_weak.confidence_estimate <= 0.70
    assert eval_weak.technical_accuracy < 60.0
    assert len(eval_weak.what_to_improve) > 0

    # 2. Strong, authoritative, senior-level response
    strong_answer = (
        "To prevent split-brain scenarios during network partitions, I implement quorum-based consensus using Raft. "
        "For read operations, I configure eventual consistency with bounded staleness, whereas critical financial state changes "
        "require strict linearizability. I enforce circuit breakers and exponential backoff to handle backpressure, and verify "
        "dead-letter queues under load to ensure zero data loss."
    )
    eval_strong = evaluator.evaluate_answer(question_text=question, candidate_answer=strong_answer)
    
    assert isinstance(eval_strong, InterviewEvaluationRubric)
    assert eval_strong.overall_score >= 85.0
    assert eval_strong.technical_accuracy >= 85.0
    assert eval_strong.confidence_estimate >= 0.85
    assert len(eval_strong.what_went_well) > 0
    assert "Raft" in str(eval_strong.what_went_well) or "Consensus" in str(eval_strong.what_went_well) or "Command" in str(eval_strong.what_went_well)

    # 3. Dynamic differential test: Strong answer MUST score higher than weak answer
    assert eval_strong.overall_score > eval_weak.overall_score + 15.0
    assert eval_strong.technical_accuracy > eval_weak.technical_accuracy + 20.0

def test_api_interview_question_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    res = client.post(
        "/api/v1/career-compass/interview/question",
        json={
            "role": "Cloud DevOps Engineer",
            "topic": "Kubernetes High-Availability & RBAC"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "generated_question" in data
    gq = data["generated_question"]
    assert "kubernetes" in gq["question_text"].lower() or "canary" in gq["question_text"].lower() or "devops" in gq["question_text"].lower()
    assert len(gq["hints"]) == 2

def test_api_interview_evaluate_endpoint_dynamic():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    # 1. Evaluate weak response
    res_weak = client.post(
        "/api/v1/career-compass/interview/evaluate",
        json={
            "question_text": "How do you optimize vector search latency?",
            "candidate_answer": "I might maybe just increase RAM or reboot.",
            "role": "AI Engineer"
        }
    )
    assert res_weak.status_code == 200
    eval_weak = res_weak.json()["evaluation"]

    # 2. Evaluate strong response
    res_strong = client.post(
        "/api/v1/career-compass/interview/evaluate",
        json={
            "question_text": "How do you optimize vector search latency?",
            "candidate_answer": "I tune HNSW index parameters (M and efConstruction) and implement two-stage retrieval using BM25 hybrid search followed by cross-encoder re-ranking. To avoid memory leaks and reduce p99 latency, we partition embeddings across sharded clusters.",
            "role": "AI Engineer"
        }
    )
    assert res_strong.status_code == 200
    eval_strong = res_strong.json()["evaluation"]

    # Confirm dynamic scoring differential
    assert eval_strong["overall_score"] > eval_weak["overall_score"] + 15.0
    assert eval_strong["metrics"]["technical_accuracy"] > eval_weak["metrics"]["technical_accuracy"] + 20.0
    assert len(eval_strong["what_went_well"]) > 0
    assert len(eval_weak["what_to_improve"]) > 0
