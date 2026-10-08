"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { MICRO_SPRINTS } from "@/lib/mockData";
import { MicroSprintData, UserNotification } from "@/types";
import SkillGapRadar from "@/components/student/SkillGapRadar";
import ReadinessRoadmap from "@/components/student/ReadinessRoadmap";
import SprintModal from "@/components/student/SprintModal";
import ResumeUploadDrawer from "@/components/student/ResumeUploadDrawer";
import SkillVerificationModal from "@/components/student/SkillVerificationModal";
import ATSResumeManagerModal from "@/components/student/ATSResumeManagerModal";
import DynamicSandboxModal from "@/components/student/DynamicSandboxModal";
import RealtimeJobAlerts from "@/components/student/RealtimeJobAlerts";
import JobDetailsModal from "@/components/student/JobDetailsModal";
import AIInterviewerModal from "@/components/student/AIInterviewerModal";
import { GitHubAnalysisModal } from "@/components/student/GitHubAnalysisModal";
import {
  UploadCloud,
  Compass,
  Radar,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ExternalLink,
  Award,
  FileText,
  Terminal,
  AlertTriangle,
  ArrowRight,
  Bot,
  Video,
} from "lucide-react";
import GithubIcon from "@/components/icons/GithubIcon";
import Link from "next/link";

export default function StudentPage() {
  const { currentStudent, activeJob } = useStore();
  const [activeTab, setActiveTab] = useState<"radar" | "roadmap">("radar");
  const [activeSprint, setActiveSprint] = useState<MicroSprintData | null>(null);
  const [isResumeDrawerOpen, setIsResumeDrawerOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isATSResumeModalOpen, setIsATSResumeModalOpen] = useState(false);
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);
  const [isAIInterviewerOpen, setIsAIInterviewerOpen] = useState(false);
  const [isGitHubAnalysisOpen, setIsGitHubAnalysisOpen] = useState(false);
  const [selectedJobModalId, setSelectedJobModalId] = useState<string | null>(null);
  const [deadlineAlerts, setDeadlineAlerts] = useState<UserNotification[]>([]);
  const [verificationSkillId, setVerificationSkillId] = useState("postgresql");
  const [verificationSkillName, setVerificationSkillName] = useState("PostgreSQL Optimization & Architecture");

  useEffect(() => {
    async function fetchDeadlines() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/notifications?user_id=cand-1");
        if (res.ok) {
          const data = await res.json();
          const deadlines = (data.notifications || []).filter(
            (n: UserNotification) => n.notification_type === "deadline_warning"
          );
          setDeadlineAlerts(deadlines);
        }
      } catch (e) {
        console.warn("Unable to fetch deadline alerts:", e);
      }
    }
    fetchDeadlines();
  }, []);

  const handleMarkAlertRead = async (notifId: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/notifications/${notifId}/read`, {
        method: "PATCH",
      });
      setDeadlineAlerts((prev) =>
        prev.map((a) => (a.id === notifId ? { ...a, is_read: true } : a))
      );
    } catch (e) {
      console.warn("Failed to mark alert as read:", e);
    }
  };

  const handleLaunchSprint = (skillId: string) => {
    const sprint = MICRO_SPRINTS[skillId] || MICRO_SPRINTS["postgres_optimization"];
    setActiveSprint(sprint);
  };

  const isJobReady = currentStudent.readinessScore >= 85;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-gray-900 border border-gray-800">
        <div className="flex items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentStudent.avatarUrl}
            alt={currentStudent.fullName}
            className="w-11 h-11 rounded-lg object-cover border border-gray-700"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-white">
                {currentStudent.fullName}
              </h2>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  isJobReady
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {currentStudent.currentTier.replace("_", " ")} ({currentStudent.readinessScore}%)
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {currentStudent.college} · Class of {currentStudent.gradYear} ·{" "}
              <span className="text-gray-300">
                {currentStudent.credentials.length} verified credentials
              </span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-start-verification-assessment"
            onClick={() => {
              setVerificationSkillId("postgresql");
              setVerificationSkillName("PostgreSQL Optimization & Architecture");
              setIsVerificationModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Verify Skill</span>
          </button>

          <button
            id="btn-open-ats-resume-studio"
            onClick={() => setIsATSResumeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume Studio</span>
          </button>

          <button
            id="btn-open-dynamic-sandbox"
            onClick={() => setIsSandboxModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Bug-Fix Sandbox</span>
          </button>

          <Link
            id="btn-open-ai-interview-studio"
            href="/interview-coach"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-sm border border-emerald-500/40"
            title="Launch Real-Time Multimodal AI Interview Coach with Video & Audio Telemetry"
          >
            <Video className="w-3.5 h-3.5 text-emerald-200" />
            <span>🎙️ Video/Audio Interview Coach</span>
          </Link>

          <button
            id="btn-open-ai-interview-coach"
            onClick={() => setIsAIInterviewerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-sm"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Quick Grill</span>
          </button>

          <button
            id="btn-open-github-verifier"
            onClick={() => setIsGitHubAnalysisOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 text-white transition-all shadow-sm border border-purple-500/40"
          >
            <GithubIcon className="w-3.5 h-3.5 text-purple-200" />
            <span>🐙 GitHub Verifier</span>
          </button>

          <Link
            href="/student/github-security"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-600 hover:to-teal-600 text-white transition-all shadow-sm border border-emerald-500/40"
            title="Audit public repos for secret leaks and 1-click auto-remediate"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
            <span>🛡️ Repo Secret Shield</span>
          </Link>

          <Link
            href="/hub"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-700/60 shadow-sm transition-all"
            title="Open Backend AI Suite & 13-Course Academy"
          >
            <span>🧠 13 Courses & AI Suite</span>
          </Link>

          <button
            onClick={() => setIsResumeDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* Job Alerts */}
      <RealtimeJobAlerts
        userId={currentStudent.id}
        onOpenJobDetails={(jobId) => setSelectedJobModalId(jobId)}
      />

      {/* Deadline Alerts */}
      {deadlineAlerts.length > 0 && (
        <div id="deadline-alerts-banner" className="space-y-2">
          {deadlineAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                !alert.is_read
                  ? "bg-red-500/5 border-red-500/20"
                  : "bg-gray-900 border-gray-800 opacity-70"
              }`}
            >
              <div className="flex items-start sm:items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    !alert.is_read
                      ? "bg-red-500/10 text-red-400"
                      : "bg-gray-800 text-gray-500"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                      Deadline
                    </span>
                    <span className="text-xs font-medium text-white">
                      {alert.job_title}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {alert.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {!alert.is_read ? (
                  <button
                    onClick={() => handleMarkAlertRead(alert.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                  >
                    Dismiss
                  </button>
                ) : (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Read
                  </span>
                )}
                <button
                  onClick={() => setActiveTab("roadmap")}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  <span>Prepare</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sprint Alert Banner */}
      {currentStudent.sprintAssigned?.status === "pending" && (
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 uppercase">
                  Sprint Assigned
                </span>
                <span className="text-xs text-gray-300">
                  Skill: <strong className="text-white">{currentStudent.sprintAssigned.skillName}</strong>
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                An employer identified a gap and assigned a micro-assessment. Complete it to improve your readiness score.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleLaunchSprint(currentStudent.sprintAssigned!.skillId)}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-900 font-medium text-xs flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Start Challenge</span>
          </button>
        </div>
      )}

      {/* Student GitHub Health & Secret Shield Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
            <GithubIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                Pre-Recruiter Defense
              </span>
              <span className="text-xs font-semibold text-white">
                GitHub Health & Leaked Secret Shield
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Audit public repositories for hardcoded API keys (OpenAI, AWS, PATs), verify .gitignore coverage, and apply 1-click zero-risk fixes before recruiters review your code.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/student/github-security"
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit & Fix Repos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("radar")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "radar"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Skill Gap Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab("roadmap")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "roadmap"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Readiness Roadmap</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
          <span>Target:</span>
          <span className="text-gray-300">{activeJob?.title}</span>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "radar" && (
        <SkillGapRadar onLaunchSprint={handleLaunchSprint} />
      )}

      {activeTab === "roadmap" && (
        <ReadinessRoadmap onLaunchSprint={handleLaunchSprint} />
      )}

      {/* Credentials */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs uppercase tracking-wider text-gray-300 font-medium">
              Verified Credentials
            </h4>
          </div>
          <span className="text-[11px] text-gray-500">
            {currentStudent.credentials.length} earned
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentStudent.credentials.map((cred) => (
            <div
              key={cred.hash}
              className="p-4 rounded-lg border border-gray-800 bg-gray-800/30 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h5 className="font-medium text-xs text-white">
                    {cred.skillName}
                  </h5>
                  <p suppressHydrationWarning className="text-[10px] text-gray-500 mt-0.5">
                    {cred.issuerOrg} · {cred.issuedAt ? cred.issuedAt.split("T")[0] : ""}
                  </p>
                </div>
                <span className="text-xs font-medium text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">
                  {cred.score}%
                </span>
              </div>

              <div className="p-2 rounded-md bg-gray-900 border border-gray-800">
                <span className="text-[10px] text-gray-500 block mb-0.5">
                  SHA-256 Hash
                </span>
                <p className="text-[11px] font-mono text-gray-400 break-all">
                  {cred.hash}
                </p>
              </div>

              <div className="pt-1.5 border-t border-gray-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
                <Link
                  href={`/verify/${cred.hash}`}
                  target="_blank"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-[11px]"
                >
                  View proof <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {isVerificationModalOpen && (
        <SkillVerificationModal
          skillId={verificationSkillId}
          skillName={verificationSkillName}
          onClose={() => setIsVerificationModalOpen(false)}
        />
      )}

      {isATSResumeModalOpen && (
        <ATSResumeManagerModal
          onClose={() => setIsATSResumeModalOpen(false)}
        />
      )}

      {activeSprint && (
        <SprintModal
          sprint={activeSprint}
          onClose={() => setActiveSprint(null)}
        />
      )}

      {isResumeDrawerOpen && (
        <ResumeUploadDrawer onClose={() => setIsResumeDrawerOpen(false)} />
      )}

      {isSandboxModalOpen && (
        <DynamicSandboxModal
          isOpen={isSandboxModalOpen}
          onClose={() => setIsSandboxModalOpen(false)}
        />
      )}

      {selectedJobModalId && (
        <JobDetailsModal
          jobId={selectedJobModalId}
          onClose={() => setSelectedJobModalId(null)}
        />
      )}

      {isAIInterviewerOpen && (
        <AIInterviewerModal
          isOpen={isAIInterviewerOpen}
          onClose={() => setIsAIInterviewerOpen(false)}
          defaultRole={currentStudent.targetRole || "Senior Backend Engineer"}
        />
      )}

      {isGitHubAnalysisOpen && (
        <GitHubAnalysisModal
          isOpen={isGitHubAnalysisOpen}
          onClose={() => setIsGitHubAnalysisOpen(false)}
          defaultUsername={
            currentStudent.githubUrl
              ? currentStudent.githubUrl.split("/").filter(Boolean).pop() || "aaravsharma-dev"
              : "aaravsharma-dev"
          }
          candidateName={currentStudent.fullName}
        />
      )}
    </div>
  );
}
