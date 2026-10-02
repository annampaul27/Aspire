/**
 * API Type Definitions for Aspire AI Backend Integration
 */

export interface GitHubAnalysisPayload {
  repository_name: string;
  repository_url: string;
  files?: string[];
  file_content?: string;
}

export interface GitHubAnalysisResponse {
  repository_name: string;
  repository_url: string;
  files: string[];
  file_content: string;
  analysis_requirements: {
    identify_project_type: boolean;
    identify_tech_stack: boolean;
    summarize_project: boolean;
    assess_complexity: boolean;
    suggest_improvements: boolean;
    generate_resume_bullets: boolean;
  };
}

export interface GitHubAuditResult {
  username: string;
  repoCount: number;
  overallScore: number;
  grade: "A+" | "A" | "B+" | "B" | "C";
  astComplexityScore: number;
  commitVelocityScore: number;
  testCoverageEstimate: number;
  verifiedLanguages: { name: string; percentage: number; color: string }[];
  verifiedFrameworks: string[];
  auditedRepos: {
    name: string;
    url: string;
    stars: number;
    forks: number;
    primaryLanguage: string;
    astComplexity: "Low" | "Medium" | "High" | "Enterprise High";
    codeQualityScore: number;
    linesOfCode: number;
    testFilesDetected: number;
    summary: string;
    architectureType: string;
    resumeBullets: string[];
    improvements: string[];
  }[];
  discrepancies: {
    skill: string;
    claimedOnResume: boolean;
    verifiedInGithub: boolean;
    status: "verified" | "discrepancy" | "warning";
    evidence: string;
  }[];
  commitConsistency: {
    last90DaysCommits: number;
    longestStreakDays: number;
    currentStreakDays: number;
    hasFakeStreakPattern: boolean;
    activeDays: number;
  };
  backendSource: "live-fastapi" | "verified-engine-cache";
  verifiedAt: string;
}

// -------------------------------------------------------------
// Course & Academy Types
// -------------------------------------------------------------
export interface CourseOverview {
  course_id: string;
  slug: string;
  title: string;
  subject: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration_minutes: number;
  description: string;
  learning_objectives: string[];
  lesson_count: number;
  mock_test: {
    question_count: number;
    duration_minutes: number;
    passing_score: number;
  };
}

export interface CourseLesson {
  lesson_id: string;
  title: string;
  duration_minutes: number;
  topics: string[];
  content: {
    type: "explanation" | "scenario" | "code_snippet" | "note";
    title?: string;
    text: string;
  }[];
  key_points: string[];
}

export interface MockTestQuestion {
  question_id: number;
  question: string;
  options: string[];
  correct_answer?: number;
  explanation?: string;
}

export interface MockTestEvaluation {
  course_id: string;
  slug: string;
  title: string;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  verdict: string;
  credential_hash: string;
  evaluated_at: string;
}

// -------------------------------------------------------------
// 90-Day Career Compass Roadmap Types
// -------------------------------------------------------------
export interface RoadmapPhase {
  phase_id: string;
  phase_name: string;
  days_range: string;
  focus_area: string;
  weekly_milestones: {
    week: number;
    milestone: string;
    skills_addressed: string[];
    deliverable: string;
    is_completed: boolean;
  }[];
}

export interface CareerCompassRoadmap {
  target_role: string;
  generated_at: string;
  overall_readiness_boost: string;
  phases: RoadmapPhase[];
  backend_source: string;
}

// -------------------------------------------------------------
// AI Technical Interview Coach Types
// -------------------------------------------------------------
export interface InterviewQuestionItem {
  id: string;
  targeted_weak_skill: string;
  question: string;
  trap_followup: string;
  model_answer: string;
  key_evaluation_signals: string[];
}

export interface AIInterviewCoachData {
  target_role: string;
  candidate_weaknesses: string[];
  questions: InterviewQuestionItem[];
}

// -------------------------------------------------------------
// Portfolio Capstone Builder Types
// -------------------------------------------------------------
export interface CapstoneProjectBlueprint {
  id: string;
  title: string;
  tagline: string;
  target_role: string;
  difficulty: "High" | "Enterprise High";
  architecture_pattern: string;
  tech_stack: string[];
  key_modules: string[];
  readme_blueprint: string;
  recruiter_wow_factor: string;
}

// -------------------------------------------------------------
// Job Market & CTC Intelligence Types
// -------------------------------------------------------------
export interface MarketSalaryBand {
  experience_level: string;
  base_lpa: string;
  with_docker_fastapi_premium: string;
  growth_delta: string;
}

export interface JobMarketIntelligence {
  target_role: string;
  total_open_roles: number;
  skill_premium_percentage: number;
  salary_bands: MarketSalaryBand[];
  hot_skills: { skill: string; demand_index: number; salary_lift: string }[];
  city_demand_distribution: { city: string; open_positions: number; avg_lpa: string }[];
}

// -------------------------------------------------------------
// 60-JD Matcher & Notifications Types
// -------------------------------------------------------------
export interface JDMatchItem {
  job_id: string;
  job_title: string;
  category: string;
  experience_level: string;
  salary_lpa: string;
  required_hard_skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  match_percentage: number;
  raw_description?: string;
}

export interface Match60JDResult {
  total_jds: number;
  candidate_skills: string[];
  matches: JDMatchItem[];
  high_roi_unlocks: {
    skill: string;
    additional_jobs_unlocked: number;
    projected_ctc_jump: string;
  }[];
}

export interface FR04WorkerSweepResult {
  status: string;
  executed_at: string;
  scanned_active_jobs: number;
  deadlines_detected: number;
  notifications_dispatched: number;
  urgency_alerts: {
    job_id: string;
    title: string;
    company: string;
    hours_remaining: number;
    alert_message: string;
  }[];
}

export interface RouterHealthStatus {
  router: string;
  endpoint_prefix: string;
  status: "ONLINE" | "CONNECTING" | "OFFLINE";
  latency_ms: number;
}

// -------------------------------------------------------------
// Student GitHub Code & Secret Auditor Types
// -------------------------------------------------------------
export interface StudentGithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  has_readme: boolean;
  default_branch: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
  health_score?: number;
  scan?: StudentRepoScanResult;
}

export interface LeakedSecretItem {
  file: string;
  line: number;
  pattern: string;
}

export interface StudentRepoScanResult {
  repo_full_name: string;
  has_gitignore: boolean;
  has_env_file: boolean;
  has_readme: boolean;
  leaked_secrets: LeakedSecretItem[];
  ai_issues: string[];
  health_score: number;
  total_files?: number;
  detected_manifests?: string[];
}

export interface RemediationResult {
  remediated: boolean;
  action_taken: string;
  commit_sha?: string;
  message: string;
  notice?: string;
}

export interface RepoInspectionResult {
  file_tree: string;
  sample_code: string;
  detected_manifests: string[];
  has_readme: boolean;
  total_files: number;
}
