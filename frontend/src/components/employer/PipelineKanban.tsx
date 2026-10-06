"use client";

import React, { useState } from "react";
import { Candidate, ProofOfWorkCredential } from "@/types";
import { useStore } from "@/lib/store";
import { useCollaborationSocket } from "@/lib/useCollaborationSocket";
import { collaborationApi } from "@/lib/api/collaboration";
import CandidateScorecardDrawer from "./CandidateScorecardDrawer";
import { ShieldCheck, Users, Star, ArrowRight, ArrowLeft } from "lucide-react";

interface PipelineKanbanProps {
  onSelectCandidate: (candidate: Candidate) => void;
  onAuditCredential: (cred: ProofOfWorkCredential, cand: Candidate) => void;
}

const STAGES: { id: Candidate["pipelineStatus"]; title: string; color: string }[] = [
  { id: "applied", title: "Applied", color: "border-gray-700 text-gray-400" },
  { id: "screened", title: "Screened", color: "border-blue-500/40 text-blue-400" },
  { id: "shortlisted", title: "Shortlisted", color: "border-purple-500/40 text-purple-400" },
  { id: "interview", title: "Interview", color: "border-amber-500/40 text-amber-400" },
  { id: "offer", title: "Offer Extended", color: "border-emerald-500/40 text-emerald-400" },
];

export default function PipelineKanban({
  onSelectCandidate,
  onAuditCredential,
}: PipelineKanbanProps) {
  const {
    candidates,
    currentOrg,
    updateCandidatePipelineStatus,
    isAnonymizedScreening,
  } = useStore();

  const [scorecardCandidate, setScorecardCandidate] = useState<Candidate | null>(null);

  // Real-Time WebSocket Synchronization Hook
  const { isConnected, peerCount } = useCollaborationSocket({
    orgId: currentOrg?.id || "org-acme",
  });

  const handleMoveStage = async (
    candidateId: string,
    currentStatus: Candidate["pipelineStatus"],
    direction: "next" | "prev"
  ) => {
    const stageIds = STAGES.map((s) => s.id);
    const currentIndex = stageIds.indexOf(currentStatus);
    const targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;

    if (targetIndex >= 0 && targetIndex < stageIds.length) {
      const targetStage = stageIds[targetIndex];

      // Optimistic update
      updateCandidatePipelineStatus(
        candidateId,
        targetStage,
        "Recruiter Kanban Action"
      );

      // Persist to backend and broadcast via WebSocket
      try {
        await collaborationApi.movePipelineStage(
          candidateId,
          currentStatus,
          targetStage,
          `Moved via live collaborative Kanban to ${targetStage.toUpperCase()}`
        );
      } catch (err) {
        console.warn("Backend pipeline stage sync warning:", err);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Kanban Header with Live Sync Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Hiring Pipeline
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Collaborative team stages and verified skill credentials.
          </p>
        </div>

        {/* WebSocket Real-Time Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
              isConnected
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60 shadow-sm shadow-emerald-950"
                : "bg-gray-900 text-gray-400 border-gray-800"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-400 animate-pulse" : "bg-gray-500"
              }`}
            />
            <span className="font-semibold">
              {isConnected ? `Live Sync Active (${peerCount} ${peerCount === 1 ? 'peer' : 'peers'})` : "Sync Connecting..."}
            </span>
          </div>
        </div>
      </div>

      {/* 5-Stage Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 overflow-x-auto min-h-[480px]">
        {STAGES.map((stage, idx) => {
          const stageCandidates = candidates.filter((c) => c.pipelineStatus === stage.id);

          return (
            <div
              key={stage.id}
              className="flex flex-col rounded-xl p-3 border border-gray-800 bg-gray-900 min-w-[220px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stage.color.split(" ")[1]}`} />
                  <span className="text-xs font-semibold text-gray-200">{stage.title}</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-950 border border-gray-800 text-gray-400">
                  {stageCandidates.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-2.5 overflow-y-auto">
                {stageCandidates.map((candidate) => {
                  const displayName = isAnonymizedScreening
                    ? candidate.anonymizedId
                    : candidate.fullName;

                  return (
                    <div
                      key={candidate.id}
                      className="p-3 rounded-lg bg-gray-950 border border-gray-800 hover:border-gray-700 transition-colors space-y-2 group shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <button
                          onClick={() => onSelectCandidate(candidate)}
                          className="text-left font-medium text-xs text-gray-200 group-hover:text-blue-400 transition-colors truncate max-w-[140px]"
                        >
                          {displayName}
                        </button>
                        <span
                          className={`text-[10px] font-mono font-semibold ${
                            candidate.readinessScore >= 85
                              ? "text-emerald-400"
                              : candidate.readinessScore >= 68
                              ? "text-amber-400"
                              : "text-red-400"
                          }`}
                        >
                          {candidate.readinessScore}%
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-400 truncate">
                        {isAnonymizedScreening
                          ? candidate.anonymizedCollege
                          : candidate.college}
                      </p>

                      {/* Cryptographic Badges */}
                      <div className="flex flex-wrap gap-1">
                        {candidate.credentials.map((cred) => (
                          <button
                            key={cred.hash}
                            onClick={() => onAuditCredential(cred, candidate)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-blue-300 border border-gray-800 flex items-center gap-1 hover:border-gray-700"
                            title="Audit SHA-256 hash"
                          >
                            <ShieldCheck className="w-3 h-3 text-blue-400" />
                            {cred.skillName.split(" ")[0]}
                          </button>
                        ))}
                      </div>

                      {/* Scorecard Evaluation Trigger Button */}
                      <div className="pt-1">
                        <button
                          onClick={() => setScorecardCandidate(candidate)}
                          className="w-full py-1 px-2 rounded bg-purple-950/30 hover:bg-purple-900/50 text-purple-300 border border-purple-800/50 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Star className="w-3 h-3 text-purple-400 fill-purple-400/30" />
                          <span>Team Scorecards & Notes</span>
                        </button>
                      </div>

                      {/* Stage Move Controls */}
                      <div className="pt-2 border-t border-gray-850 flex items-center justify-between">
                        {idx > 0 ? (
                          <button
                            onClick={() => handleMoveStage(candidate.id, candidate.pipelineStatus, "prev")}
                            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-0.5"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Prev</span>
                          </button>
                        ) : (
                          <span />
                        )}
                        {idx < STAGES.length - 1 && (
                          <button
                            onClick={() => handleMoveStage(candidate.id, candidate.pipelineStatus, "next")}
                            className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5"
                          >
                            <span>Advance</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {stageCandidates.length === 0 && (
                  <div className="py-8 text-center text-xs text-gray-600 font-mono italic">
                    Empty Stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Scorecard & Notes Drawer */}
      <CandidateScorecardDrawer
        candidate={scorecardCandidate}
        isOpen={!!scorecardCandidate}
        onClose={() => setScorecardCandidate(null)}
      />
    </div>
  );
}
