import {
  CandidateScorecard,
  ScorecardSummary,
  RecruiterNote,
  CollaboratorPresence,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("aspire_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface MoveStageResponse {
  success: boolean;
  stage_change_id: string;
  candidate_id: string;
  candidate_name: string;
  new_stage: string;
  message: string;
}

export interface ScorecardsResponse {
  candidate_id: string;
  scorecards: CandidateScorecard[];
  summary: ScorecardSummary;
  count: number;
}

export interface SubmitScorecardResponse {
  success: boolean;
  scorecard: CandidateScorecard;
  summary: ScorecardSummary;
  message: string;
}

export interface NotesResponse {
  candidate_id: string;
  notes: RecruiterNote[];
  count: number;
}

export interface NoteResponse {
  success: boolean;
  note: RecruiterNote;
}

export interface PresenceResponse {
  org_id: string;
  peer_count: number;
  collaborators: CollaboratorPresence[];
}

export interface PipelineHistoryResponse {
  candidate_id: string;
  history: {
    id: string;
    from_stage: string;
    to_stage: string;
    changed_by: string;
    reason?: string;
    created_at: string;
  }[];
  count: number;
}

export const collaborationApi = {
  /**
   * Atomically moves a candidate to a new pipeline stage and triggers WebSocket broadcast
   */
  async movePipelineStage(
    candidateId: string,
    fromStage: string,
    toStage: string,
    reason?: string,
    jobId?: string
  ): Promise<MoveStageResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/collaboration/pipeline/move`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        candidate_id: candidateId,
        from_stage: fromStage,
        to_stage: toStage,
        reason: reason || "Recruiter collaborative Kanban move",
        job_id: jobId,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to move candidate pipeline stage.");
    }
    return res.json();
  },

  /**
   * Submits or updates an evaluation scorecard for a candidate
   */
  async submitScorecard(payload: {
    candidate_id: string;
    overall_recommendation: string;
    technical_rating: number;
    communication_rating: number;
    problem_solving_rating: number;
    culture_add_rating: number;
    feedback_notes: string;
    job_id?: string;
  }): Promise<SubmitScorecardResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/collaboration/scorecards`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to submit evaluation scorecard.");
    }
    return res.json();
  },

  /**
   * Retrieves all reviewer scorecards and consolidated team consensus
   */
  async getScorecards(candidateId: string): Promise<ScorecardsResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/collaboration/scorecards/${candidateId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to load candidate scorecards.");
    }
    return res.json();
  },

  /**
   * Adds a private recruiter note to a candidate
   */
  async createNote(
    candidateId: string,
    noteContent: string,
    isPrivate = true
  ): Promise<NoteResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/collaboration/notes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        candidate_id: candidateId,
        note_content: noteContent,
        is_private: isPrivate,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create recruiter note.");
    }
    return res.json();
  },

  /**
   * Retrieves all notes for a candidate
   */
  async getNotes(candidateId: string): Promise<NotesResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/collaboration/notes/${candidateId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch candidate notes.");
    }
    return res.json();
  },

  /**
   * Retrieves active team presence and collaborator count
   */
  async getPresence(): Promise<PresenceResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/collaboration/presence`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch team presence.");
    }
    return res.json();
  },

  /**
   * Retrieves candidate pipeline movement history
   */
  async getPipelineHistory(candidateId: string): Promise<PipelineHistoryResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/collaboration/pipeline/history/${candidateId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch pipeline history.");
    }
    return res.json();
  },
};
