from services.interview_coach.core.schemas import (
    SpeechAcousticsMetrics,
    VisionTelemetryMetrics,
)
from services.interview_coach.core.config import settings

def clamp(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """Clamps a floating point value within [min_val, max_val]."""
    return max(min_val, min(max_val, value))

def calculate_technical_score(accuracy: float, clarity: float) -> float:
    """
    Computes technical score using weighted semantic accuracy (60%) and structure/clarity (40%).
    Academic Model: S_tech = 0.60 * Accuracy + 0.40 * Clarity
    """
    bounded_accuracy = clamp(accuracy)
    bounded_clarity = clamp(clarity)
    raw_score = (0.60 * bounded_accuracy) + (0.40 * bounded_clarity)
    return round(clamp(raw_score), 1)

def calculate_vocal_score(metrics: SpeechAcousticsMetrics) -> float:
    """
    Computes vocal delivery score using speech pacing (WPM), filler-word frequency, and pauses.
    Academic Model:
    S_vocal = 100 - Delta_WPM_penalty - (FillerCount * 4.0) - Pause_penalty
    """
    # 1. Cadence Penalty: optimal range is 120 to 165 WPM
    wpm = metrics.wpm
    cadence_penalty = 0.0
    if wpm < settings.OPTIMAL_WPM_MIN:
        cadence_penalty = (settings.OPTIMAL_WPM_MIN - wpm) * 0.45
    elif wpm > settings.OPTIMAL_WPM_MAX:
        cadence_penalty = (wpm - settings.OPTIMAL_WPM_MAX) * 0.45

    # 2. Filler words penalty
    filler_penalty = float(metrics.filler_word_count) * 4.0

    # 3. Pause penalty for awkward silences > 3.0s
    pause_penalty = 0.0
    if metrics.pause_duration_seconds > 3.0:
        pause_penalty = (metrics.pause_duration_seconds - 3.0) * 1.5

    total_penalty = cadence_penalty + filler_penalty + pause_penalty
    raw_score = 100.0 - total_penalty
    return round(clamp(raw_score), 1)

def calculate_nonverbal_score(metrics: VisionTelemetryMetrics) -> float:
    """
    Computes non-verbal composure from eye-contact ratio and head stability.
    Academic Model: S_nonverbal = (EyeContactRatio * 60) + (HeadStabilityIndex * 0.40)
    """
    bounded_eye_contact = max(0.0, min(1.0, metrics.eye_contact_ratio))
    bounded_stability = clamp(metrics.head_stability_index)
    raw_score = (bounded_eye_contact * 60.0) + (bounded_stability * 0.40)
    return round(clamp(raw_score), 1)

def calculate_composite_hireability(
    tech_score: float,
    vocal_score: float,
    nonverbal_score: float,
) -> float:
    """
    Computes Composite Hireability Index (CHI) in [0.0, 100.0]:
    CHI = (0.50 * S_tech) + (0.25 * S_vocal) + (0.25 * S_nonverbal)
    """
    s_t = clamp(tech_score)
    s_v = clamp(vocal_score)
    s_n = clamp(nonverbal_score)
    chi = (
        (settings.WEIGHT_TECHNICAL * s_t)
        + (settings.WEIGHT_VOCAL * s_v)
        + (settings.WEIGHT_NONVERBAL * s_n)
    )
    return round(clamp(chi), 1)

def classify_hireability_verdict(chi: float) -> str:
    """Maps continuous CHI score into standard hiring committee verdicts."""
    if chi >= 85.0:
        return "Strong Hire"
    elif chi >= 70.0:
        return "Hire"
    elif chi >= 55.0:
        return "Leaning Hire"
    elif chi >= 40.0:
        return "Needs Improvement"
    else:
        return "Do Not Hire"
