import re
from typing import List
from services.interview_coach.core.config import settings
from services.interview_coach.core.schemas import SpeechAcousticsMetrics

class AudioAcousticsAnalyzer:
    """
    Analyzes spoken responses for speaking rate (WPM), speech cadence,
    verbal filler tics, and estimated pause duration.
    """

    def __init__(self, filler_words: List[str] = None):
        self.filler_words = [f.lower() for f in (filler_words or settings.FILLER_WORDS)]
        # Compile regex pattern matching whole words or multi-word phrases
        escaped_phrases = [re.escape(w) for w in self.filler_words]
        self._filler_regex = re.compile(r'\b(' + '|'.join(escaped_phrases) + r')\b', re.IGNORECASE)

    def analyze_transcript(
        self,
        transcript: str,
        duration_seconds: float = 30.0
    ) -> SpeechAcousticsMetrics:
        """
        Parses transcript, detects fillers, and computes Words-Per-Minute.
        """
        clean_text = transcript.strip()
        words = re.findall(r'\b\w+\b', clean_text)
        word_count = len(words)

        safe_duration = max(1.0, float(duration_seconds))
        wpm = (word_count / safe_duration) * 60.0

        # Classify cadence
        if wpm < 110.0:
            cadence_rating = "Too Slow"
        elif 110.0 <= wpm < 125.0:
            cadence_rating = "Slightly Slow"
        elif 125.0 <= wpm <= 165.0:
            cadence_rating = "Optimal"
        elif 165.0 < wpm <= 190.0:
            cadence_rating = "Slightly Fast"
        else:
            cadence_rating = "Too Fast"

        # Detect fillers
        detected_fillers: List[str] = []
        filler_matches = self._filler_regex.findall(clean_text)
        for match in filler_matches:
            detected_fillers.append(match.lower())

        filler_count = len(detected_fillers)
        unique_detected = sorted(list(set(detected_fillers)))
        filler_pct = (filler_count / max(1, word_count)) * 100.0

        # Estimate pause duration based on punctuation breaks (ellipses, em-dashes, commas)
        pause_indicators = len(re.findall(r'(\.{3}|--|,|\.\s)', clean_text))
        pause_duration = min(safe_duration * 0.35, pause_indicators * 0.4)

        return SpeechAcousticsMetrics(
            word_count=word_count,
            duration_seconds=round(safe_duration, 1),
            wpm=round(wpm, 1),
            cadence_rating=cadence_rating,
            filler_words_detected=unique_detected,
            filler_word_count=filler_count,
            filler_percentage=round(filler_pct, 1),
            pause_duration_seconds=round(pause_duration, 1),
        )
