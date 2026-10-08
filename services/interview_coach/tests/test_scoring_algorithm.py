import pytest
from services.interview_coach.core.scoring import (
    calculate_technical_score,
    calculate_vocal_score,
    calculate_nonverbal_score,
    calculate_composite_hireability,
    classify_hireability_verdict,
)
from services.interview_coach.core.schemas import (
    SpeechAcousticsMetrics,
    VisionTelemetryMetrics,
)

def test_calculate_technical_score_weighted_formula():
    # 60% accuracy + 40% clarity
    score = calculate_technical_score(accuracy=90.0, clarity=80.0)
    assert score == (0.60 * 90.0) + (0.40 * 80.0)  # 54 + 32 = 86.0

def test_calculate_technical_score_clamping():
    assert calculate_technical_score(accuracy=120.0, clarity=150.0) == 100.0
    assert calculate_technical_score(accuracy=-20.0, clarity=-10.0) == 0.0

def test_calculate_vocal_score_optimal_cadence_zero_fillers():
    # Ideal cadence (140 WPM), 0 fillers, 0 pause penalties -> 100.0
    metrics = SpeechAcousticsMetrics(
        word_count=140,
        duration_seconds=60.0,
        wpm=140.0,
        cadence_rating="Optimal",
        filler_words_detected=[],
        filler_word_count=0,
        filler_percentage=0.0,
        pause_duration_seconds=1.5,
    )
    score = calculate_vocal_score(metrics)
    assert score >= 95.0

def test_calculate_vocal_score_penalizes_fillers_and_abnormal_cadence():
    # Rapid talker (220 WPM), 8 filler words
    metrics = SpeechAcousticsMetrics(
        word_count=220,
        duration_seconds=60.0,
        wpm=220.0,
        cadence_rating="Too Fast",
        filler_words_detected=["um", "like", "actually"],
        filler_word_count=8,
        filler_percentage=3.6,
        pause_duration_seconds=8.0,
    )
    score = calculate_vocal_score(metrics)
    assert score < 70.0

def test_calculate_nonverbal_score():
    # 85% eye contact, 90 stability
    metrics = VisionTelemetryMetrics(
        eye_contact_ratio=0.85,
        gaze_deviation_count=2,
        head_stability_index=90.0,
        composure_index=88.0,
        non_verbal_rating="Engaged & Steady",
    )
    score = calculate_nonverbal_score(metrics)
    # (0.85 * 60) + (90.0 * 0.40) = 51 + 36 = 87.0
    assert score == pytest.approx(87.0, 0.1)

def test_composite_hireability_and_verdict():
    # Technical: 90, Vocal: 80, Nonverbal: 80
    # Composite: (90 * 0.50) + (80 * 0.25) + (80 * 0.25) = 45 + 20 + 20 = 85.0
    chi = calculate_composite_hireability(tech_score=90.0, vocal_score=80.0, nonverbal_score=80.0)
    assert chi == 85.0
    verdict = classify_hireability_verdict(chi)
    assert verdict == "Strong Hire"

def test_verdict_tiers():
    assert classify_hireability_verdict(92.0) == "Strong Hire"
    assert classify_hireability_verdict(78.0) == "Hire"
    assert classify_hireability_verdict(65.0) == "Leaning Hire"
    assert classify_hireability_verdict(52.0) == "Needs Improvement"
    assert classify_hireability_verdict(35.0) == "Do Not Hire"
