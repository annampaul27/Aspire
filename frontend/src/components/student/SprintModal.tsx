"use client";

import React, { useState, useEffect, useRef } from "react";
import { MicroSprintData } from "@/types";
import { useStore } from "@/lib/store";
import confetti from "canvas-confetti";
import {
  Sparkles,
  BookOpen,
  Bug,
  HelpCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  X,
  ExternalLink,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface SprintModalProps {
  sprint: MicroSprintData;
  onClose: () => void;
}

export default function SprintModal({ sprint, onClose }: SprintModalProps) {
  const { currentStudent, mintCredential, logAnomaly, addToast } = useStore();
  const [part, setPart] = useState<1 | 2 | 3>(1);

  // Quiz State (Part 3)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [mintedHash, setMintedHash] = useState<string | null>(null);

  // Timed 90-second countdown timer per question (S7)
  const [timeLeft, setTimeLeft] = useState(90);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Anti-cheat tab-blur detection (S8)
  const [tabBlurEvents, setTabBlurEvents] = useState(0);
  const [tabBlurWarning, setTabBlurWarning] = useState<string | null>(null);

  // Tab-blur anti-cheat listener (S8)
  useEffect(() => {
    const handleBlur = () => {
      if (part === 3 && !quizFinished) {
        setTabBlurEvents((prev) => {
          const updated = prev + 1;
          const warningMsg = `⚠️ Anti-Cheat Warning (S8): Window focus lost! Tab blur count: ${updated}. All blur events are recorded in your cryptographic audit log.`;
          setTabBlurWarning(warningMsg);
          logAnomaly({
            type: "Tab-blur Threshold Exceeded",
            description: `Student ${currentStudent.fullName} triggered tab-blur event during timed ${sprint.skillName} assessment.`,
            candidateName: currentStudent.fullName,
            severity: updated >= 3 ? "high" : "medium",
          });
          return updated;
        });
      }
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [part, quizFinished, currentStudent.fullName, sprint.skillName, logAnomaly]);

  const handleTimeUp = React.useCallback(() => {
    setIsAnswerSubmitted(true);
    addToast({
      type: "warning",
      title: "Time Expired (S7)",
      message: "The 90-second countdown has reached 0. Your current selection was locked.",
    });
  }, [addToast]);

  const handleTimeUpRef = useRef(handleTimeUp);
  useEffect(() => {
    handleTimeUpRef.current = handleTimeUp;
  });

  // 90s countdown timer effect (S7)
  useEffect(() => {
    if (part === 3 && !isAnswerSubmitted && !quizFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleTimeUpRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [part, isAnswerSubmitted, quizFinished]);

  const handleSelectOption = (optionIndex: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const currentQ = sprint.part3Questions[currentQuestionIndex];
  const selectedOption = selectedAnswers[currentQuestionIndex];

  const handleConfirmAnswer = () => {
    setIsAnswerSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < sprint.part3Questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setIsAnswerSubmitted(false);
      setTimeLeft(90);
    } else {
      // Complete quiz
      if (timerRef.current) clearInterval(timerRef.current);

      // Compute grade (S9)
      let correctCount = 0;
      const answersLog = sprint.part3Questions.map((q, idx) => {
        const userChoice = selectedAnswers[idx];
        const isCorrect = userChoice === q.correctOptionIndex;
        if (isCorrect) correctCount++;
        return {
          questionId: q.id,
          question: q.question,
          selectedOption: q.options[userChoice] || "No answer (Timeout)",
          isCorrect,
          timeSpentSeconds: 90 - timeLeft,
        };
      });

      const finalPercentage = Math.round(
        (correctCount / sprint.part3Questions.length) * 100
      );
      setScore(finalPercentage);
      setQuizFinished(true);

      // Mint SHA-256 credential if >= 80% (S10)
      if (finalPercentage >= 80) {
        // Trigger celebratory confetti!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}

        const cred = await mintCredential({
          candidateId: currentStudent.id,
          candidateName: currentStudent.fullName,
          candidateEmail: currentStudent.email,
          skillId: sprint.skillId,
          skillName: sprint.skillName,
          score: finalPercentage,
          passedQuestions: correctCount,
          totalQuestions: sprint.part3Questions.length,
          issuerOrg: "Aspire AI Deterministic Engine",
          isSponsored: !!sprint.sponsorOrgName,
          sponsorOrg: sprint.sponsorOrgName,
          answersLog,
          antiCheatAudit: {
            tabBlurEvents,
            flagged: tabBlurEvents >= 3,
          },
        });
        setMintedHash(cred.hash);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl glass-panel-elevated border-cyan-500/50 p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">
                  10-Minute Micro-Learning Sprint (S5, S6)
                </h3>
                {sprint.sponsorOrgName && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                    Sponsored by {sprint.sponsorOrgName} (S23)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Node: <span className="text-cyan-300 font-semibold">{sprint.skillName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Part Step Navigation Bar (S6) */}
        {!quizFinished && (
          <div className="grid grid-cols-3 gap-2 mt-4 border-b border-slate-800 pb-3">
            <button
              onClick={() => setPart(1)}
              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                part === 1
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0 text-cyan-400" />
              <div>
                <p className="font-semibold leading-tight">Part 1: Concept</p>
                <p className="text-[10px] text-slate-500">2-Min Mental Model</p>
              </div>
            </button>

            <button
              onClick={() => setPart(2)}
              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                part === 2
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <Bug className="w-4 h-4 shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold leading-tight">Part 2: Scenario</p>
                <p className="text-[10px] text-slate-500">Prod Incident & Diff</p>
              </div>
            </button>

            <button
              onClick={() => setPart(3)}
              className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                part === 3
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <HelpCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <div>
                <p className="font-semibold leading-tight">Part 3: Assessment</p>
                <p className="text-[10px] text-slate-500">90s Timed & Verified</p>
              </div>
            </button>
          </div>
        )}

        {/* Tab-blur anti-cheat alert banner (S8) */}
        {tabBlurWarning && !quizFinished && (
          <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">{tabBlurWarning}</span>
            </div>
            <button
              onClick={() => setTabBlurWarning(null)}
              className="text-amber-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Sprint Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* PART 1: 2-MINUTE CONCEPT SUMMARY (S6) */}
          {part === 1 && !quizFinished && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold tracking-wider">
                  Actionable Architecture
                </span>
                <h4 className="text-base font-bold text-white mt-1">
                  {sprint.part1Concept.title}
                </h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {sprint.part1Concept.summary}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Core Mental Models:
                </h5>
                <ul className="space-y-2">
                  {sprint.part1Concept.mentalModel.map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200">
                <strong className="text-cyan-400 font-mono uppercase block mb-1">
                  Industrial Rule of Thumb:
                </strong>
                {sprint.part1Concept.keyTakeaway}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPart(2)}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all"
                >
                  <span>Proceed to Part 2: Incident Debugging</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PART 2: INDUSTRIAL DEBUGGING SCENARIO (S6) */}
          {part === 2 && !quizFinished && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-amber-400 font-semibold tracking-wider">
                  Live Post-Mortem Incident
                </span>
                <h4 className="text-base font-bold text-white mt-1">
                  {sprint.part2Scenario.title}
                </h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {sprint.part2Scenario.incidentDescription}
                </p>
              </div>

              {/* Broken Code Snippet */}
              <div className="rounded-xl border border-red-500/30 bg-[#090b14] overflow-hidden">
                <div className="px-3.5 py-1.5 bg-red-950/40 border-b border-red-500/20 text-[10px] font-mono text-red-300 font-semibold flex items-center justify-between">
                  <span>BROKEN PRODUCTION QUERY / INCIDENT CODE</span>
                  <span className="text-red-400">p99 = 8,400ms</span>
                </div>
                <pre className="p-3 text-xs font-mono text-red-200 overflow-x-auto whitespace-pre leading-relaxed">
                  {sprint.part2Scenario.brokenCodeSnippet}
                </pre>
              </div>

              {/* Root cause */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <strong className="text-slate-200 block mb-0.5">Root Cause Analysis:</strong>
                {sprint.part2Scenario.rootCause}
              </div>

              {/* Remediation Snippet */}
              <div className="rounded-xl border border-emerald-500/30 bg-[#090b14] overflow-hidden">
                <div className="px-3.5 py-1.5 bg-emerald-950/40 border-b border-emerald-500/20 text-[10px] font-mono text-emerald-300 font-semibold flex items-center justify-between">
                  <span>VERIFIED ZERO-DOWNTIME REMEDIATION PATCH</span>
                  <span className="text-emerald-400">p99 = 0.8ms</span>
                </div>
                <pre className="p-3 text-xs font-mono text-emerald-200 overflow-x-auto whitespace-pre leading-relaxed">
                  {sprint.part2Scenario.remediationCodeSnippet}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setPart(1)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  ← Back to Concept
                </button>
                <button
                  onClick={() => {
                    setPart(3);
                    setTimeLeft(90);
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <span>Launch Part 3: Timed Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PART 3: ADAPTIVE QUIZ WITH 90s COUNTDOWN & TAB BLUR DETECTION (S7, S8, S9, S10) */}
          {part === 3 && !quizFinished && (
            <div className="space-y-4 animate-in fade-in">
              {/* Question Header & 90s Urgency Timer */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    Question {currentQuestionIndex + 1} of {sprint.part3Questions.length}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {currentQ.conceptTag}
                  </span>
                </div>

                {/* 90-second countdown ring (S7) */}
                <div className="flex items-center gap-2">
                  <Clock
                    className={`w-4 h-4 ${
                      timeLeft <= 20 ? "text-red-400 animate-pulse" : "text-cyan-400"
                    }`}
                  />
                  <div className="font-mono text-xs font-bold">
                    <span
                      className={`text-sm ${
                        timeLeft <= 20 ? "text-red-400" : "text-cyan-300"
                      }`}
                    >
                      {timeLeft}s
                    </span>{" "}
                    <span className="text-[10px] text-slate-500">(S7 Anti-Copy)</span>
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-sm font-semibold text-slate-100 leading-relaxed">
                  {currentQ.question}
                </h4>
                {currentQ.codeSnippet && (
                  <pre className="p-3 rounded-lg bg-slate-900 text-xs font-mono text-cyan-200 overflow-x-auto whitespace-pre">
                    {currentQ.codeSnippet}
                  </pre>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  let borderStyle = "border-slate-800 hover:border-slate-700 bg-slate-900/50";
                  if (isAnswerSubmitted) {
                    if (optIdx === currentQ.correctOptionIndex) {
                      borderStyle = "border-emerald-500/80 bg-emerald-950/40 text-emerald-200";
                    } else if (isSelected) {
                      borderStyle = "border-red-500/80 bg-red-950/40 text-red-200";
                    }
                  } else if (isSelected) {
                    borderStyle = "border-cyan-500/80 bg-cyan-950/40 text-cyan-200";
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 ${borderStyle}`}
                    >
                      <span className="w-5 h-5 rounded-md bg-slate-950 border border-slate-700 flex items-center justify-center font-mono text-[10px] shrink-0 font-semibold">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="leading-relaxed flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Instant Explanation Feedback (S9) */}
              {isAnswerSubmitted && (
                <div
                  className={`p-4 rounded-xl border text-xs leading-relaxed animate-in fade-in ${
                    selectedOption === currentQ.correctOptionIndex
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                      : "bg-red-950/30 border-red-500/40 text-red-200"
                  }`}
                >
                  <strong className="block mb-1 font-mono uppercase text-[10px]">
                    {selectedOption === currentQ.correctOptionIndex
                      ? "✓ Correct Answer Explanation (S9)"
                      : "✕ Diagnostic Explanation (S9)"}
                  </strong>
                  <p>{currentQ.explanations[currentQ.correctOptionIndex]}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleConfirmAnswer}
                    disabled={selectedOption === undefined}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-40"
                  >
                    Lock & Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    <span>
                      {currentQuestionIndex < sprint.part3Questions.length - 1
                        ? "Next Question"
                        : "Finish & Claim Credential"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* QUIZ FINISHED / MINTED CREDENTIAL CELEBRATION */}
          {quizFinished && (
            <div className="space-y-5 py-4 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-white">
                  Assessment Complete — Competency Mastered!
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  You scored <span className="text-emerald-400 font-bold font-mono text-sm">{score}%</span> on{" "}
                  <span className="text-white font-semibold">{sprint.skillName}</span>.
                </p>
              </div>

              {score >= 80 && mintedHash ? (
                <div className="p-5 rounded-xl border border-gray-800 bg-gray-950 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-emerald-400 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Verified SHA-256 Micro-Credential
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Immutable Proof
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 block mb-1">
                      Verification Digest Hash:
                    </span>
                    <p className="p-2.5 rounded-lg bg-gray-900 text-xs font-mono text-emerald-300 break-all border border-gray-800">
                      {mintedHash}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-gray-200 font-medium">Public Verification URL</p>
                      <p className="text-xs text-gray-400">
                        Share on LinkedIn, resumes, or send to recruiters
                      </p>
                    </div>
                    <Link
                      href={`/verify/${mintedHash}`}
                      target="_blank"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                    >
                      Audit Hash <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Impact Notification */}
                  <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/60 flex items-center gap-2.5 text-xs text-blue-200">
                    <Zap className="w-4 h-4 text-blue-400 shrink-0" />
                    <p>
                      <strong className="text-white font-semibold">Readiness Impact:</strong>{" "}
                      Your fit score benchmark against employer openings has increased to{" "}
                      <strong className="text-emerald-400 font-mono">Job-Ready (≥85%)</strong>!
                      You are now elevated on the recruiter radar.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-300 text-left">
                  <p className="font-semibold">Pass threshold is 80% to mint a cryptographic proof.</p>
                  <p className="mt-1 text-slate-300">
                    Review the incident diff in Part 2 and re-attempt the adaptive challenge to earn your verifiable badge.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
