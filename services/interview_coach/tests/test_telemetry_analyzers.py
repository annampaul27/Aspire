import pytest
from services.interview_coach.engine.audio_analyzer import AudioAcousticsAnalyzer
from services.interview_coach.engine.vision_analyzer import VisionTelemetryAnalyzer

def test_audio_analyzer_optimal_speech():
    analyzer = AudioAcousticsAnalyzer()
    transcript = (
        "In our distributed architecture, we partitioned the database using consistent hashing "
        "to ensure high availability and minimal reshuffling during node rebalancing. "
        "We also implemented asynchronous message queues with Kafka to handle backpressure effectively."
    )
    # 33 words in 13.0 seconds -> 152.3 WPM
    metrics = analyzer.analyze_transcript(transcript, duration_seconds=13.0)
    assert metrics.word_count >= 30
    assert 130.0 <= metrics.wpm <= 165.0
    assert metrics.cadence_rating == "Optimal"
    assert metrics.filler_word_count == 0
    assert metrics.filler_percentage == 0.0

def test_audio_analyzer_filler_words_and_fast_pace():
    analyzer = AudioAcousticsAnalyzer()
    transcript = (
        "Um, basically, like, we used a microservices setup, you know, and actually, "
        "um, the database was, like, Postgres, right?"
    )
    # 18 words in 4.0 seconds -> 270 WPM (Very fast) with 6 fillers
    metrics = analyzer.analyze_transcript(transcript, duration_seconds=4.0)
    assert metrics.filler_word_count >= 5
    assert "um" in metrics.filler_words_detected
    assert "like" in metrics.filler_words_detected
    assert "actually" in metrics.filler_words_detected
    assert metrics.cadence_rating == "Too Fast"

def test_vision_analyzer_engaged_candidate():
    analyzer = VisionTelemetryAnalyzer()
    # 90% eye contact frames, 92 head stability
    metrics = analyzer.analyze_metrics(
        eye_contact_ratio=0.90,
        head_stability_index=92.0,
        gaze_deviations=2
    )
    assert metrics.eye_contact_ratio == 0.90
    assert metrics.head_stability_index == 92.0
    assert metrics.composure_index >= 90.0
    assert "Exceptional" in metrics.non_verbal_rating or "Confident" in metrics.non_verbal_rating

def test_vision_analyzer_fidgeting_candidate():
    analyzer = VisionTelemetryAnalyzer()
    metrics = analyzer.analyze_metrics(
        eye_contact_ratio=0.35,
        head_stability_index=40.0,
        gaze_deviations=12
    )
    assert metrics.composure_index < 50.0
    assert "Frequent Gaze Aversion" in metrics.non_verbal_rating
