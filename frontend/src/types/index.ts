export type ReadinessTier = "job_ready" | "bridgeable" | "mismatch";

export type RoleType = "employer" | "student" | "admin";

export type OrgType = "corporate" | "staffing" | "university";

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  logo: string;
  plan: "Starter" | "Growth" | "Enterprise" | "Academic Pass";
  seatsUsed: number;
  seatsTotal: number;
  status: "active" | "trial" | "suspended";
  createdDate: string;
  metrics: {
    candidatesScreened: number;
    hoursSaved: number;
    bridgeableHired: number;
    gapSprintsCompleted: number;
  };
}

export interface SkillNode {
  id: string;
  name: string;
  category: "frontend" | "backend" | "devops" | "data_ai" | "core";
  weight: number; // 3.0 for Critical / Must-have, 1.0 for Optional
  isCritical: boolean;
  synonyms?: string[];
  description?: string;
}

export interface CandidateSkill {
  skillId: string;
  skillName: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  isVerified: boolean; // Assessment passed S10
  credentialHash?: string;
  verifiedAt?: string;
  score?: number;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  bulletPoints: string[];
}

export interface Candidate {
  id: string;
  fullName: string;
  anonymizedId: string; // e.g. "Candidate #8492" (E17)
  email: string;
  college: string;
  anonymizedCollege: string; // "Tier-1 Technical Institute"
  gradYear: number;
  avatarUrl: string;
  targetRole: string;
  currentTier: ReadinessTier;
  readinessScore: number; // 0 - 100%
  skills: CandidateSkill[];
  missingCompetencies: string[]; // Discrete missing competencies
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl?: string;
  experienceYears: number;
  workExperience?: WorkExperience[];
  projects: {
    title: string;
    description: string;
    tech: string[];
    link?: string;
  }[];
  pipelineStatus: "applied" | "screened" | "shortlisted" | "interview" | "offer";
  statusHistory: {
    status: string;
    timestamp: string;
    updatedBy: string;
  }[];
  credentials: ProofOfWorkCredential[];
  sprintAssigned?: {
    skillId: string;
    skillName: string;
    dispatchedAt: string;
    status: "pending" | "in_progress" | "passed";
  };
}

export interface JobOpening {
  id: string;
  orgId: string;
  title: string;
  department: string;
  location: string;
  type: "Full-Time" | "Remote" | "Contract";
  experienceMinYears: number;
  salaryRange: string;
  criticalSkills: SkillNode[]; // weight = 3.0
  optionalSkills: SkillNode[]; // weight = 1.0
  description: string;
  applicantsCount: number;
  status: "active" | "paused" | "under_review";
  passThreshold: number; // e.g. 85%
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanations: string[]; // Explanation for each option
  difficulty: "intermediate" | "advanced";
  conceptTag: string;
}

export interface MicroSprintData {
  skillId: string;
  skillName: string;
  estimatedMinutes: number;
  sponsorOrgName?: string;
  part1Concept: {
    title: string;
    summary: string;
    mentalModel: string[];
    keyTakeaway: string;
  };
  part2Scenario: {
    title: string;
    incidentDescription: string;
    brokenCodeSnippet: string;
    rootCause: string;
    remediationCodeSnippet: string;
    keyTakeaways: string[];
  };
  part3Questions: QuizQuestion[];
}

export interface ProofOfWorkCredential {
  hash: string; // SHA-256
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  skillId: string;
  skillName: string;
  score: number; // >= 80%
  passedQuestions: number;
  totalQuestions: number;
  issuedAt: string;
  issuerOrg: string;
  isSponsored: boolean;
  sponsorOrg?: string;
  canonicalPayload: string; // Raw canonicalized JSON string that hashes to `hash`
  answersLog: {
    questionId: string;
    question: string;
    selectedOption: string;
    isCorrect: boolean;
    timeSpentSeconds: number;
  }[];
  antiCheatAudit: {
    tabBlurEvents: number;
    flagged: boolean;
  };
}

export interface AnomalyLog {
  id: string;
  type: "Rapid-fire Assessment" | "Tab-blur Threshold Exceeded" | "Volume Spike" | "Sponsor Conflict";
  description: string;
  candidateName?: string;
  orgName?: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  resolved: boolean;
}

export interface UserNotification {
  id: string;
  user_id: string;
  job_id: string;
  job_title?: string;
  company?: string;
  message: string;
  notification_type: "deadline_warning" | "opening_warning" | "job_match" | string;
  is_read: boolean;
  trigger_date: string;
  application_deadline?: string;
  opening_date?: string;
  location?: string;
  created_at: string;
}

export interface CandidateScorecard {
  id: string;
  candidate_id: string;
  reviewer_id: string;
  reviewer_name?: string;
  overall_recommendation: "strong_hire" | "hire" | "neutral" | "reject";
  technical_rating: number; // 1-5
  communication_rating: number; // 1-5
  problem_solving_rating: number; // 1-5
  culture_add_rating: number; // 1-5
  feedback_notes: string;
  created_at: string;
  updated_at: string;
}

export interface ScorecardSummary {
  total_reviews: number;
  avg_technical: number;
  avg_communication: number;
  avg_problem_solving: number;
  avg_culture_add: number;
  composite_score: number;
  recommendation_breakdown: {
    strong_hire: number;
    hire: number;
    neutral: number;
    reject: number;
  };
  consensus: "consensus_hire" | "consensus_reject" | "mixed_reviews" | "pending_evaluations";
}

export interface RecruiterNote {
  id: string;
  candidate_id: string;
  author_id: string;
  author_name: string;
  note_content: string;
  is_private: boolean;
  created_at: string;
}

export interface CollaboratorPresence {
  user_id: string;
  full_name: string;
  role: string;
  email?: string;
  connected_at: string;
}

export interface PipelineStageEvent {
  stage_change_id: string;
  candidate_id: string;
  candidate_name: string;
  from_stage: Candidate["pipelineStatus"];
  to_stage: Candidate["pipelineStatus"];
  changed_by: {
    id: string;
    name: string;
  };
  reason?: string;
  timestamp: string;
}


