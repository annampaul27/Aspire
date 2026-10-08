import { API_BASE_URL, fetchWithTimeout } from "./client";

export interface RoleTopicPreset {
  role: string;
  topic: string;
  description: string;
  difficulty: string;
}

export interface QuestionGenerationRequest {
  role: string;
  topic: string;
  difficulty: string;
  candidate_name?: string;
}

export interface InterviewQuestionResponse {
  question_id: string;
  role: string;
  topic: string;
  difficulty: string;
  question_scenario: string;
  hints: string[];
  expected_keywords: string[];
  follow_up_traps: string[];
}

export interface SpeechAcousticsMetrics {
  word_count: number;
  duration_seconds: number;
  wpm: number;
  cadence_rating: string;
  filler_words_detected: string[];
  filler_word_count: number;
  filler_percentage: number;
  pause_duration_seconds: number;
}

export interface VisionTelemetryMetrics {
  eye_contact_ratio: number;
  gaze_deviation_count: number;
  head_stability_index: number;
  composure_index: number;
  non_verbal_rating: string;
}

export interface AnswerSubmissionRequest {
  question_id: string;
  role: string;
  question_text: string;
  candidate_transcript: string;
  audio_duration_seconds: number;
  eye_contact_ratio: number;
  head_stability_score: number;
  is_follow_up?: boolean;
  prior_answer?: string;
}

export interface FollowUpProbeResponse {
  probe_id: string;
  probe_question: string;
  probe_focus: string;
  hint?: string;
}

export interface HireabilityEvaluationReport {
  report_id: string;
  candidate_name: string;
  role: string;
  topic: string;
  overall_hireability_score: number;
  verdict: string;
  technical_score: number;
  vocal_score: number;
  nonverbal_score: number;
  speech_metrics: SpeechAcousticsMetrics;
  vision_metrics: VisionTelemetryMetrics;
  rubric_breakdown: Record<string, number>;
  what_went_well: string[];
  what_to_improve: string[];
  model_senior_response: string;
  radar_chart_data: Record<string, number>;
  created_at: string;
}

export const interviewCoachApi = {
  async getPresets(): Promise<RoleTopicPreset[]> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interview-coach/presets`);
    if (!res.ok) throw new Error("Failed to load interview presets");
    const data = await res.json();
    return data.presets;
  },

  async generateQuestion(req: QuestionGenerationRequest): Promise<InterviewQuestionResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interview-coach/question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error("Failed to generate interview question");
    return res.json();
  },

  async generateFollowUp(questionText: string, candidateAnswer: string, role: string): Promise<FollowUpProbeResponse> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interview-coach/follow-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_text: questionText, candidate_answer: candidateAnswer, role }),
    });
    if (!res.ok) throw new Error("Failed to generate follow-up probe");
    return res.json();
  },

  async evaluateSession(req: AnswerSubmissionRequest): Promise<HireabilityEvaluationReport> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interview-coach/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error("Failed to evaluate interview response");
    return res.json();
  },
};
