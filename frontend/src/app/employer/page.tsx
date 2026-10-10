"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Candidate, ProofOfWorkCredential } from "@/types";
import TalentRadar from "@/components/employer/TalentRadar";
import PipelineKanban from "@/components/employer/PipelineKanban";
import ProofOfWorkModal from "@/components/employer/ProofOfWorkModal";
import CandidateDrawer from "@/components/employer/CandidateDrawer";
import JobCreatorModal from "@/components/employer/JobCreatorModal";
import UniversityCohortAnalytics from "@/components/employer/UniversityCohortAnalytics";
import RecruitmentFunnelAnalytics from "@/components/employer/RecruitmentFunnelAnalytics";
import Link from "next/link";
import {
  Plus,
  Layers,
  GraduationCap,
  Users,
  Eye,
  EyeOff,
  Share2,
  Check,
  Settings,
  BarChart3,
} from "lucide-react";
import RoleGuard from "@/components/auth/RoleGuard";

export default function EmployerPage() {
  const {
    candidates,
    currentOrg,
    activeJob,
    dispatchGapSprint,
    isAnonymizedScreening,
    setIsAnonymizedScreening,
    addToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"radar" | "pipeline" | "cohort" | "analytics">("radar");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [auditCredential, setAuditCredential] = useState<{
    cred: ProofOfWorkCredential;
    candidate: Candidate;
  } | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const handleAudit = (cred: ProofOfWorkCredential, candidate: Candidate) => {
    setAuditCredential({ cred, candidate });
  };

  const handleShareShortlist = () => {
    const url = window.location.origin + "/verify/" + (auditCredential?.cred.hash || "sample");
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    addToast({
      type: "info",
      title: "Shortlist Link Copied",
      message: "Shareable link copied to clipboard.",
    });
    setTimeout(() => setCopiedShareLink(false), 3000);
  };

  return (
    <RoleGuard allowedRoles={["employer", "admin"]} portalName="Employer ATS Portal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-gray-900 border border-gray-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-xl">
            {currentOrg.logo}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-white">
                {activeJob?.title || "Lead Software Architect"}
              </h2>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Active
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {currentOrg.name} · {activeJob?.department} · {activeJob?.salaryRange} ·{" "}
              <span className="text-gray-300">{candidates.length} candidates</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Blind Screening Toggle */}
          <button
            id="btn-blind-merit-screening-toggle-top"
            onClick={() => {
              const nextVal = !isAnonymizedScreening;
              setIsAnonymizedScreening(nextVal);
              addToast({
                type: "info",
                title: nextVal ? "Blind Screening Enabled" : "Blind Screening Disabled",
                message: nextVal
                  ? "Candidate identities are now anonymized."
                  : "Candidate identities are now visible.",
              });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isAnonymizedScreening
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                : "bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200"
            }`}
          >
            {isAnonymizedScreening ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Blind Screening: On</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Blind Screening: Off</span>
              </>
            )}
          </button>

          {/* Share Link */}
          <button
            onClick={handleShareShortlist}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-medium text-gray-300 hover:text-white transition-colors"
          >
            {copiedShareLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Shortlist</span>
              </>
            )}
          </button>

          {/* New Job */}
          <button
            onClick={() => setIsJobModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Job</span>
          </button>

          {/* Recruiter Profile Link */}
          <Link
            href="/employer/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-medium text-gray-300 hover:text-white transition-colors"
            title="Recruiter & Workspace Profile"
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span>Profile</span>
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
            <Users className="w-3.5 h-3.5" />
            <span>Talent Radar</span>
          </button>

          <button
            onClick={() => setActiveTab("pipeline")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "pipeline"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab("cohort")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "cohort"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>University Cohort</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "analytics"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Hiring Analytics & APM</span>
          </button>
        </div>

        <div className="hidden sm:block text-xs text-gray-500">
          {currentOrg.plan} · {currentOrg.seatsUsed}/{currentOrg.seatsTotal} seats
        </div>
      </div>

      {/* Content */}
      {activeTab === "radar" && (
        <TalentRadar
          candidates={candidates}
          onSelectCandidate={(cand) => setSelectedCandidate(cand)}
          onAuditCredential={(cred, cand) => handleAudit(cred, cand)}
        />
      )}

      {activeTab === "pipeline" && (
        <PipelineKanban
          onSelectCandidate={(cand) => setSelectedCandidate(cand)}
          onAuditCredential={(cred, cand) => handleAudit(cred, cand)}
        />
      )}

      {activeTab === "cohort" && <UniversityCohortAnalytics />}

      {activeTab === "analytics" && <RecruitmentFunnelAnalytics />}

      {/* Modals */}
      {selectedCandidate && (
        <CandidateDrawer
          candidate={
            candidates.find((c) => c.id === selectedCandidate.id) || selectedCandidate
          }
          onClose={() => setSelectedCandidate(null)}
          onAuditCredential={(cred) => handleAudit(cred, selectedCandidate)}
          onDispatchSprint={(candId, skillId, skillName) => {
            dispatchGapSprint(candId, skillId, skillName);
          }}
        />
      )}

      {auditCredential && (
        <ProofOfWorkModal
          credential={auditCredential.cred}
          candidate={auditCredential.candidate}
          onClose={() => setAuditCredential(null)}
        />
      )}

      {isJobModalOpen && (
        <JobCreatorModal onClose={() => setIsJobModalOpen(false)} />
      )}
      </div>
    </RoleGuard>
  );
}
