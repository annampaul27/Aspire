"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import confetti from "canvas-confetti";
import {
  Clock,
  XCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  X,
  Award,
  RotateCcw,
  Bookmark,
  Check,
} from "lucide-react";

interface QuestionItem {
  id: string;
  question: string;
  options: string[];
  codeSnippet?: string;
  difficulty?: string;
}

interface GradeResult {
  assessment_id: string;
  user_id: string;
  skill_id: string;
  skill_name: string;
  score: number;
  correct_count: number;
  total_questions: number;
  time_taken_seconds: number;
  time_taken_formatted: string;
  verification_status: "Passed" | "Failed";
  badge_tier?: "Bronze" | "Silver" | "Gold" | "Diamond" | null;
  badge_metadata?: {
    tier: string;
    title: string;
    icon: string;
    accent_color: string;
    description: string;
  };
  user_class: string;
  feedback: string;
}

interface SkillVerificationModalProps {
  skillId?: string;
  skillName?: string;
  onClose: () => void;
}

const TOTAL_TEST_SECONDS = 720; // Exactly 12 minutes (12 * 60)
const REQUIRED_QUESTIONS_COUNT = 20;

export default function SkillVerificationModal({
  skillId = "postgresql",
  skillName = "PostgreSQL Optimization & Architecture",
  onClose,
}: SkillVerificationModalProps) {
  const { currentStudent, mintCredential, addToast } = useStore();

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    const key = `aspireai_answers_${skillId}_${currentStudent.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});

  // 12-Minute Countdown Timer with LocalStorage State Persistence
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_TEST_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const handleSubmitAssessmentRef = useRef<(() => Promise<void>) | null>(null);
  const storageKey = `aspireai_timer_${skillId}_${currentStudent.id}`;
  const answersStorageKey = `aspireai_answers_${skillId}_${currentStudent.id}`;

  // 1. Fetch exactly 20 questions
  useEffect(() => {
    let isMounted = true;
    async function loadQuestions() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/assessments/${skillId}/questions`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.questions && data.questions.length >= REQUIRED_QUESTIONS_COUNT) {
            setQuestions(data.questions.slice(0, REQUIRED_QUESTIONS_COUNT));
            setLoadingQuestions(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Backend questions fetch failed, utilizing deterministic client fallback", e);
      }

      // High-grade fallback with exactly 20 questions
      const fallback20: QuestionItem[] = [
        {
          id: "q1",
          question: "Which index type is best suited for searching within full-text document arrays or JSONB data with containment queries (@>)?",
          options: ["B-Tree", "GIN (Generalized Inverted Index)", "BRIN (Block Range Index)", "Hash Index"],
        },
        {
          id: "q2",
          question: "What happens when an autovacuum worker runs in standard (non-FULL) mode in PostgreSQL?",
          options: [
            "It locks the entire table exclusively and rebuilds it",
            "It marks dead tuples as reusable in the Free Space Map without returning disk space to the OS",
            "It truncates all WAL files and restarts transaction ID counter",
            "It converts all unlogged tables into logged tables",
          ],
        },
        {
          id: "q3",
          question: "In an EXPLAIN ANALYZE output, what does 'Bitmap Heap Scan' indicate?",
          options: [
            "PostgreSQL is scanning an unindexed table in parallel",
            "PostgreSQL created a memory bitmap of matching tuple page pointers from one or more indexes before fetching rows",
            "The query has exceeded maintenance_work_mem and spilled to disk",
            "The table has zero statistics and needs ANALYZE",
          ],
        },
        {
          id: "q4",
          question: "What is the primary danger of Transaction ID (XID) wraparound in PostgreSQL?",
          options: [
            "The database automatically upgrades all connections to SSL",
            "Past transactions can appear to have occurred in the future, causing catastrophic data invisibility",
            "WAL buffers expand indefinitely until RAM is exhausted",
            "Foreign keys are permanently disabled",
          ],
        },
        {
          id: "q5",
          question: "Which isolation level prevents 'Non-repeatable Reads' and 'Dirty Reads' but may still permit 'Serialization Anomalies' unless SERIALIZABLE is used?",
          options: ["Read Uncommitted", "Read Committed", "Repeatable Read", "None of the above"],
        },
        {
          id: "q6",
          question: "When should you prefer a BRIN (Block Range Index) over a B-Tree index?",
          options: [
            "For high-cardinality random UUID primary keys",
            "For naturally ordered append-only tables (e.g., timestamps) stored in physical correlation to disk order",
            "For JSONB fields with nested key-value pairs",
            "For small tables with under 100 rows",
          ],
        },
        {
          id: "q7",
          question: "What is the purpose of connection pooling software like PgBouncer in high-traffic architectures?",
          options: [
            "To automatically generate database migrations",
            "To mitigate PostgreSQL process-per-connection overhead and optimize backend memory usage",
            "To replicate data cross-region synchronously",
            "To compress JSON data stored in tables",
          ],
        },
        {
          id: "q8",
          question: "How does PostgreSQL implement Multi-Version Concurrency Control (MVCC) for UPDATE operations?",
          options: [
            "By directly overwriting row bytes in place with an exclusive mutex",
            "By inserting a new row version (tuple) with updated xmin and marking the old tuple's xmax",
            "By writing updates exclusively to a separate undo log",
            "By locking the entire database schema",
          ],
        },
        {
          id: "q9",
          question: "What is the purpose of the 'work_mem' configuration setting in postgresql.conf?",
          options: [
            "Maximum RAM allocated globally for the shared buffer pool",
            "Amount of memory used by internal sort operations and hash tables before switching to temporary disk files",
            "Memory dedicated exclusively to autovacuum workers",
            "Maximum size of a single JSONB column",
          ],
        },
        {
          id: "q10",
          question: "Which command creates an index on a large live production table without acquiring an exclusive write lock (AccessExclusiveLock)?",
          options: [
            "CREATE INDEX ON table (column);",
            "CREATE INDEX CONCURRENTLY ON table (column);",
            "CREATE INDEX WITHOUT LOCK ON table (column);",
            "ALTER TABLE ADD INDEX ASYNC (column);",
          ],
        },
        {
          id: "q11",
          question: "What does a 'Foreign Data Wrapper' (FDW) permit in PostgreSQL?",
          options: [
            "Encrypting columns using foreign RSA keys",
            "Querying external databases (e.g. Postgres, MySQL, Redis, MongoDB) via standard SQL tables",
            "Exporting schema definitions to GraphQL schemas",
            "Managing cloud Kubernetes ingress controllers",
          ],
        },
        {
          id: "q12",
          question: "What is the benefit of using an unlogged table (CREATE UNLOGGED TABLE)?",
          options: [
            "It survives unexpected power loss and OS crashes safely",
            "Significantly faster write operations because mutations bypass Write-Ahead Logging (WAL)",
            "It automatically disables all foreign key checks",
            "It encrypts all data automatically",
          ],
        },
        {
          id: "q13",
          question: "What does the 'shared_buffers' parameter dictate?",
          options: [
            "Amount of memory PostgreSQL uses for shared memory buffers caching table and index pages",
            "Disk space reserved for dead tuple archives",
            "Maximum network buffer per TCP socket",
            "Number of concurrent replication slots",
          ],
        },
        {
          id: "q14",
          question: "Which SQL construct allows you to execute hierarchical or tree-traversal queries in PostgreSQL?",
          options: ["SELECT ... GROUPING SETS", "WITH RECURSIVE", "SELECT ... ROLLUP", "CROSS APPLY"],
        },
        {
          id: "q15",
          question: "What does the 'max_connections' parameter control, and why should it NOT be set excessively high (e.g., 5000)?",
          options: [
            "It specifies maximum column length; high values degrade CPU cache",
            "It specifies concurrent client connections; too many cause high context switching and RAM thrashing",
            "It limits the number of tables in a single database schema",
            "It limits daily API requests from external clients",
          ],
        },
        {
          id: "q16",
          question: "What is the key advantage of PostgreSQL declarative table partitioning?",
          options: [
            "It automatically encodes all columns into Base64",
            "Partition pruning allows query planner to skip scanning irrelevant partitions, boosting performance on large datasets",
            "It converts relational tables into NoSQL document stores",
            "It eliminates the need for primary keys",
          ],
        },
        {
          id: "q17",
          question: "What is a 'Partial Index' in PostgreSQL?",
          options: [
            "An index built on only half of the table's rows chosen at random",
            "An index built over a subset of a table defined by a WHERE conditional clause",
            "An index that stores only the first 4 bytes of each string",
            "An incomplete index created during a system crash",
          ],
        },
        {
          id: "q18",
          question: "What does the 'FILLFACTOR' storage parameter control on a table or B-Tree index?",
          options: [
            "Percentage of disk storage reserved for backup dumps",
            "Percentage of each page to pack with data, leaving free space for HOT (Heap-Only Tuples) updates",
            "Ratio of CPU cores to RAM allocation",
            "Maximum size of a BLOB payload",
          ],
        },
        {
          id: "q19",
          question: "What is the difference between synchronous and asynchronous physical streaming replication?",
          options: [
            "Synchronous replication uses HTTP while asynchronous uses WebSockets",
            "In synchronous replication, commits wait until at least one standby confirms writing the WAL to disk",
            "Asynchronous replication requires third-party cloud plugins",
            "Synchronous replication only supports read-only primary nodes",
          ],
        },
        {
          id: "q20",
          question: "What is the primary role of the pg_stat_statements extension?",
          options: [
            "To log user password hashes for compliance auditing",
            "To track execution statistics of all SQL statements executed on the server to identify slow queries and bottlenecks",
            "To automatically generate unit tests for stored procedures",
            "To run automated index defragmentation every midnight",
          ],
        },
      ];

      if (isMounted) {
        setQuestions(fallback20);
        setLoadingQuestions(false);
      }
    }

    loadQuestions();
    return () => {
      isMounted = false;
    };
  }, [skillId]);

  // 2. Strict 12-Minute Countdown Timer with LocalStorage State Persistence
  useEffect(() => {
    if (gradeResult) return;

    // Check LocalStorage for existing timer state
    let targetEndTime: number;
    const storedTimer = localStorage.getItem(storageKey);

    if (storedTimer) {
      try {
        const parsed = JSON.parse(storedTimer);
        targetEndTime = parsed.endTime;
      } catch {
        targetEndTime = Date.now() + TOTAL_TEST_SECONDS * 1000;
        localStorage.setItem(storageKey, JSON.stringify({ endTime: targetEndTime, totalSeconds: TOTAL_TEST_SECONDS, skillId }));
      }
    } else {
      targetEndTime = Date.now() + TOTAL_TEST_SECONDS * 1000;
      localStorage.setItem(storageKey, JSON.stringify({ endTime: targetEndTime, totalSeconds: TOTAL_TEST_SECONDS, skillId }));
    }

    // Interval to calculate remaining seconds from absolute targetEndTime
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((targetEndTime - now) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        // Time expired: Auto-submit
        addToast({
          type: "warning",
          title: "12-Minute Time Limit Reached (FR-01)",
          message: "Assessment timer has expired. Your current answers are being submitted for grading.",
        });
        if (handleSubmitAssessmentRef.current) {
          handleSubmitAssessmentRef.current();
        }
      }
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [storageKey, answersStorageKey, gradeResult, addToast, skillId]);

  const handleSelectOption = (optionIndex: number) => {
    if (gradeResult || isSubmitting || !questions[currentIndex]) return;
    const qId = questions[currentIndex].id;
    const updated = {
      ...selectedAnswers,
      [qId]: optionIndex,
    };
    setSelectedAnswers(updated);
    localStorage.setItem(answersStorageKey, JSON.stringify(updated));
  };

  const handleToggleFlag = () => {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;
    setFlaggedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleSubmitAssessment = async () => {
    if (isSubmitting || gradeResult) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpent = TOTAL_TEST_SECONDS - secondsRemaining;

    try {
      const response = await fetch("http://localhost:8000/api/v1/assessments/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentStudent.id,
          skill_id: skillId,
          time_taken_seconds: timeSpent,
          answers: selectedAnswers,
        }),
      });

      if (response.ok) {
        const result: GradeResult = await response.json();
        setGradeResult(result);
        localStorage.removeItem(storageKey);
        localStorage.removeItem(answersStorageKey);

        if (result.verification_status === "Passed") {
          try {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 },
            });
          } catch {}

          // Also mint in client-side crypto store
          await mintCredential({
            candidateId: currentStudent.id,
            candidateName: currentStudent.fullName,
            candidateEmail: currentStudent.email,
            skillId,
            skillName,
            score: result.score,
            passedQuestions: result.correct_count,
            totalQuestions: result.total_questions,
            issuerOrg: "Aspire AI Multi-Tier Badge Engine",
            isSponsored: false,
            answersLog: [],
            antiCheatAudit: { tabBlurEvents: 0, flagged: false },
          });

          addToast({
            type: "credential",
            title: `Badge Earned: ${result.badge_tier} Tier (${result.score}%)`,
            message: `Congratulations! ${result.skill_name} verified as Passed at ${result.badge_tier} level.`,
          });
        } else {
          addToast({
            type: "warning",
            title: "Verification Failed (< 70%)",
            message: `Score was ${result.score}%. Minimum passing threshold is 70%. Review topics and retake.`,
          });
        }
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn("Backend grading endpoint unavailable, running client fallback grading", err);
    }

    // Client-side fallback grading matching backend specification
    let correctCount = 0;
    // Indices based on answer key
    const answerKey: Record<string, number> = {
      q1: 1, q2: 1, q3: 1, q4: 1, q5: 2, q6: 1, q7: 1, q8: 1, q9: 1, q10: 1,
      q11: 1, q12: 1, q13: 0, q14: 1, q15: 1, q16: 1, q17: 1, q18: 1, q19: 1, q20: 1
    };

    questions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      const correct = answerKey[q.id] !== undefined ? answerKey[q.id] : 0;
      if (selected === correct) correctCount++;
    });

    const scorePercent = Math.round((correctCount / REQUIRED_QUESTIONS_COUNT) * 100);
    const passed = scorePercent >= 70;
    let badgeTier: GradeResult["badge_tier"] = null;

    if (passed) {
      if (scorePercent >= 95) badgeTier = "Diamond";
      else if (scorePercent >= 85) badgeTier = "Gold";
      else if (scorePercent >= 75) badgeTier = "Silver";
      else badgeTier = "Bronze";
    }

    const fallbackResult: GradeResult = {
      assessment_id: `asmt-local-${Date.now().toString(36)}`,
      user_id: currentStudent.id,
      skill_id: skillId,
      skill_name: skillName,
      score: scorePercent,
      correct_count: correctCount,
      total_questions: REQUIRED_QUESTIONS_COUNT,
      time_taken_seconds: timeSpent,
      time_taken_formatted: `${Math.floor(timeSpent / 60).toString().padStart(2, "0")}:${(timeSpent % 60).toString().padStart(2, "0")}`,
      verification_status: passed ? "Passed" : "Failed",
      badge_tier: badgeTier,
      badge_metadata: badgeTier ? {
        tier: badgeTier,
        title: `${badgeTier} Certified Specialist`,
        icon: badgeTier === "Diamond" ? "💎" : badgeTier === "Gold" ? "🥇" : badgeTier === "Silver" ? "🥈" : "🥉",
        accent_color: badgeTier === "Diamond" ? "#06B6D4" : badgeTier === "Gold" ? "#F59E0B" : badgeTier === "Silver" ? "#94A3B8" : "#CD7F32",
        description: `Verified competency achieved with ${scorePercent}% pass rate.`,
      } : undefined,
      user_class: currentStudent.experienceYears >= 1 ? "Experienced" : "Fresher",
      feedback: passed
        ? `Exceptional performance! You cleared the 70% threshold and earned the ${badgeTier} Badge.`
        : `Assessment score was ${scorePercent}%, which is below the mandatory 70% threshold. Skill status marked as 'Failed'.`,
    };

    setGradeResult(fallbackResult);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(answersStorageKey);

    if (passed) {
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch {}
      await mintCredential({
        candidateId: currentStudent.id,
        candidateName: currentStudent.fullName,
        candidateEmail: currentStudent.email,
        skillId,
        skillName,
        score: scorePercent,
        passedQuestions: correctCount,
        totalQuestions: REQUIRED_QUESTIONS_COUNT,
        issuerOrg: "Aspire AI Verification Engine",
        isSponsored: false,
        answersLog: [],
        antiCheatAudit: { tabBlurEvents: 0, flagged: false },
      });
      addToast({
        type: "credential",
        title: `Badge Earned: ${badgeTier} Tier (${scorePercent}%)`,
        message: `${skillName} verified as Passed at ${badgeTier} level.`,
      });
    } else {
      addToast({
        type: "warning",
        title: "Verification Failed (< 70%)",
        message: `Score was ${scorePercent}%. Minimum passing threshold is 70%.`,
      });
    }

    setIsSubmitting(false);
  };
  useEffect(() => {
    handleSubmitAssessmentRef.current = handleSubmitAssessment;
  });

  const handleRetake = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(answersStorageKey);
    setSelectedAnswers({});
    setFlaggedQuestions({});
    setCurrentIndex(0);
    setGradeResult(null);
    setSecondsRemaining(TOTAL_TEST_SECONDS);
  };

  // Timer format (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentIndex];
  const isTimerCritical = secondsRemaining <= 120; // Last 2 minutes warning
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 animate-in fade-in">
      <div className="relative w-full max-w-4xl rounded-xl border border-gray-700 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[95vh] bg-gray-900 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">
                  Skill Verification Assessment
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-medium">
                  20 Questions • 12-Min Countdown
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Evaluating: <span className="text-gray-200 font-medium">{skillName}</span> • Candidate:{" "}
                <span className="text-gray-200">{currentStudent.fullName}</span> ({currentStudent.experienceYears >= 1 ? "Experienced" : "Fresher"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Strict 12-Minute Countdown Timer Display */}
            {!gradeResult && (
              <div
                id="assessment-timer-display"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-sm font-bold shadow-sm transition-colors ${
                  isTimerCritical
                    ? "bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse"
                    : "bg-slate-900 border-slate-700 text-cyan-400"
                }`}
              >
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{formatTime(secondsRemaining)}</span>
                <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">(Persisted)</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {gradeResult ? (
          /* RESULT MODAL (FR-01: Threshold >= 70% issues Badge Tier, < 70% Failed) */
          <div className="py-6 overflow-y-auto space-y-6">
            <div
              className={`p-6 rounded-2xl border text-center space-y-4 shadow-xl ${
                gradeResult.verification_status === "Passed"
                  ? "bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40 shadow-emerald-950/30"
                  : "bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40 shadow-rose-950/30"
              }`}
            >
              {/* Badge Icon / Status */}
              <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-white/10 bg-slate-900">
                {gradeResult.verification_status === "Passed" ? (
                  gradeResult.badge_metadata?.icon || "🏅"
                ) : (
                  <XCircle className="w-12 h-12 text-rose-400" />
                )}
              </div>

              <div>
                <span
                  className={`text-xs font-mono uppercase font-bold px-3 py-1 rounded-full border ${
                    gradeResult.verification_status === "Passed"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                      : "bg-rose-950 text-rose-300 border-rose-700"
                  }`}
                >
                  Status: {gradeResult.verification_status} (Threshold: 70%)
                </span>

                <h2 className="text-2xl font-bold text-white mt-2">
                  {gradeResult.verification_status === "Passed"
                    ? `${gradeResult.badge_tier} Tier Badge Awarded!`
                    : "Skill Verification Failed"}
                </h2>

                <p className="text-xs text-slate-300 max-w-lg mx-auto mt-1">
                  {gradeResult.feedback}
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Score</span>
                  <span className="text-lg font-bold text-white font-mono">{gradeResult.score}%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Correct Qs</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {gradeResult.correct_count} / {gradeResult.total_questions}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Time Taken</span>
                  <span className="text-lg font-bold text-cyan-400 font-mono">
                    {gradeResult.time_taken_formatted}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">User Class</span>
                  <span className="text-lg font-bold text-indigo-400 font-mono">
                    {gradeResult.user_class}
                  </span>
                </div>
              </div>

              {/* Tier Rubric Explanation */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-left max-w-2xl mx-auto text-xs space-y-1.5">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                  Platform Multi-Tier Badge Criteria:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className={`p-1.5 rounded border ${gradeResult.badge_tier === "Diamond" ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-bold" : "border-slate-800 text-slate-400"}`}>
                    💎 Diamond (≥95%)
                  </div>
                  <div className={`p-1.5 rounded border ${gradeResult.badge_tier === "Gold" ? "bg-amber-950 border-amber-500 text-amber-300 font-bold" : "border-slate-800 text-slate-400"}`}>
                    🥇 Gold (85-94%)
                  </div>
                  <div className={`p-1.5 rounded border ${gradeResult.badge_tier === "Silver" ? "bg-slate-800 border-slate-500 text-slate-200 font-bold" : "border-slate-800 text-slate-400"}`}>
                    🥈 Silver (75-84%)
                  </div>
                  <div className={`p-1.5 rounded border ${gradeResult.badge_tier === "Bronze" ? "bg-orange-950 border-orange-700 text-orange-300 font-bold" : "border-slate-800 text-slate-400"}`}>
                    🥉 Bronze (70-74%)
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1">
                  *Scores below 70% mark the skill as &quot;Failed&quot; and require a re-evaluation attempt.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {gradeResult.verification_status === "Failed" && (
                  <button
                    onClick={handleRetake}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake Assessment</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Return to Student Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE ASSESSMENT VIEW (Exactly 20 Questions) */
          <div className="flex-1 flex flex-col pt-4 overflow-y-auto space-y-4">
            
            {/* Question Navigator Palette (1 to 20) */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-slate-400">
                  Question Palette ({answeredCount} / {REQUIRED_QUESTIONS_COUNT} Answered)
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  Passing Baseline: 14/20 (70%)
                </span>
              </div>

              <div className="grid grid-cols-10 sm:grid-cols-20 gap-1.5">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isFlagged = !!flaggedQuestions[q.id];

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-8 rounded-lg font-mono text-xs font-bold transition-all relative flex items-center justify-center ${
                        isCurrent
                          ? "bg-cyan-500 text-slate-950 ring-2 ring-cyan-400 shadow-md scale-105"
                          : isAnswered
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900"
                          : isFlagged
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Card */}
            {loadingQuestions || !currentQ ? (
              <div className="flex-1 flex items-center justify-center p-12 text-slate-400 text-xs">
                Loading 20 questions for verification...
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between space-y-4 p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <div className="space-y-4">
                  {/* Question Meta Bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      Question {currentIndex + 1} of {REQUIRED_QUESTIONS_COUNT}
                    </span>

                    <button
                      onClick={handleToggleFlag}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                        flaggedQuestions[currentQ.id]
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{flaggedQuestions[currentQ.id] ? "Flagged" : "Flag for Review"}</span>
                    </button>
                  </div>

                  {/* Question Title */}
                  <h4 className="text-base font-semibold text-white leading-relaxed">
                    {currentQ.question}
                  </h4>

                  {/* Optional Code Snippet */}
                  {currentQ.codeSnippet && (
                    <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                      <code>{currentQ.codeSnippet}</code>
                    </pre>
                  )}

                  {/* Multiple Choice Options */}
                  <div className="space-y-2.5 pt-2">
                    {currentQ.options.map((optionText, optIdx) => {
                      const isSelected = selectedAnswers[currentQ.id] === optIdx;
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(optIdx)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                            isSelected
                              ? "bg-cyan-950/40 border-cyan-500/80 shadow-md text-white"
                              : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:bg-slate-900/40"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center border transition-colors ${
                              isSelected
                                ? "bg-cyan-500 text-slate-950 border-cyan-400"
                                : "bg-slate-900 text-slate-400 border-slate-700"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span className="text-xs leading-normal">{optionText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation and Submission Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-4">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-3">
                    {currentIndex < REQUIRED_QUESTIONS_COUNT - 1 ? (
                      <button
                        onClick={() => setCurrentIndex((prev) => Math.min(REQUIRED_QUESTIONS_COUNT - 1, prev + 1))}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors"
                      >
                        <span>Next Question</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        disabled={isSubmitting}
                        onClick={handleSubmitAssessment}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        {isSubmitting ? (
                          <span>Grading...</span>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Submit for Grading (FR-01)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
