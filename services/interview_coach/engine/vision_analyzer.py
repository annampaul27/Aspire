from typing import List, Optional
from services.interview_coach.core.schemas import VisionTelemetryMetrics

class VisionTelemetryAnalyzer:
    """
    Analyzes visual telemetry: eye-contact percentage, gaze deviations,
    head posture stability, and overall non-verbal composure.
    """

    def analyze_metrics(
        self,
        eye_contact_ratio: float,
        head_stability_index: float,
        gaze_deviations: int = 0
    ) -> VisionTelemetryMetrics:
        """
        Synthesizes visual telemetry metrics into a standardized report.
        """
        # Bounded values
        ratio = max(0.0, min(1.0, float(eye_contact_ratio)))
        stability = max(0.0, min(100.0, float(head_stability_index)))
        deviations = max(0, int(gaze_deviations))

        # Composure Index: 50% eye-contact weight + 50% stability weight
        # Eye contact contributes up to 50 points; stability contributes up to 50 points
        composure = (ratio * 50.0) + (stability * 0.50)

        # Penalize excessive gaze deviations (> 8 deviations)
        if deviations > 8:
            composure = max(0.0, composure - (deviations - 8) * 1.5)

        # Rating label
        if composure >= 85.0:
            rating = "Exceptional Eye Contact & Poise"
        elif composure >= 70.0:
            rating = "Confident & Engaged"
        elif composure >= 55.0:
            rating = "Adequate Composure"
        else:
            rating = "Frequent Gaze Aversion / Fidgeting"

        return VisionTelemetryMetrics(
            eye_contact_ratio=round(ratio, 2),
            gaze_deviation_count=deviations,
            head_stability_index=round(stability, 1),
            composure_index=round(composure, 1),
            non_verbal_rating=rating,
        )

    def analyze_frames(
        self,
        gaze_frames: List[bool],
        stability_samples: Optional[List[float]] = None
    ) -> VisionTelemetryMetrics:
        """
        Processes a raw time-series array of frame booleans (True = eye contact on screen).
        """
        if not gaze_frames:
            return self.analyze_metrics(0.75, 80.0, 2)

        total_frames = len(gaze_frames)
        positive_frames = sum(1 for f in gaze_frames if f)
        ratio = positive_frames / total_frames

        # Count state transitions from True to False as deviations
        deviations = 0
        for i in range(1, total_frames):
            if gaze_frames[i-1] and not gaze_frames[i]:
                deviations += 1

        avg_stability = 85.0
        if stability_samples and len(stability_samples) > 0:
            avg_stability = sum(stability_samples) / len(stability_samples)

        return self.analyze_metrics(ratio, avg_stability, deviations)
