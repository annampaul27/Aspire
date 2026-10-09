"use client";

import React, { useState, useEffect } from "react";
import { Candidate, CandidateScorecard, ScorecardSummary, RecruiterNote } from "@/types";
import { collaborationApi } from "@/lib/api/collaboration";
import { useStore } from "@/lib/store";
import {
  X,
  Star,
  Award,
  Users,
  MessageSquare,
  History,
  CheckCircle2,
  Send,
  Lock,
} from "lucide-react";

interface CandidateScorecardDrawerProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PipelineHistoryItem {
  id: string;
  from_stage: string;
  to_stage: string;
  changed_by: string;
  reason?: string;
  created_at: string;
}

export default function CandidateScorecardDrawer({
  candidate,
  isOpen,
  onClose,
}: CandidateScorecardDrawerProps) {
  const { addToast } = useStore();
  const [activeTab, setActiveTab] = useState<"evaluate" | "team_reviews" | "notes" | "history">("evaluate");

  // Scorecards State
  const [scorecards, setScorecards] = useState<CandidateScorecard[]>([]);
  const [summary, setSummary] = useState<ScorecardSummary | null>(null);

  // Form State
  const [techRating, setTechRating] = useState<number>(4);
  const [commRating, setCommRating] = useState<number>(4);
  const [problemRating, setProblemRating] = useState<number>(4);
  const [cultureRating, setCultureRating] = useState<number>(5);
  const [recommendation, setRecommendation] = useState<"strong_hire" | "hire" | "neutral" | "reject">("hire");
  const [feedbackNotes, setFeedbackNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Notes State
  const [notes, setNotes] = useState<RecruiterNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState<string>("");
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

  // History State
  const [history, setHistory] = useState<PipelineHistoryItem[]>([]);

  useEffect(() => {
    let isCancelled = false;
    if (isOpen && candidate) {
      const loadData = async () => {
        try {
          const [scRes, notesRes, histRes] = await Promise.all([
            collaborationApi.getScorecards(candidate.id).catch(() => null),
            collaborationApi.getNotes(candidate.id).catch(() => null),
            collaborationApi.getPipelineHistory(candidate.id).catch(() => null),
          ]);
          if (isCancelled) return;
          if (scRes) {
            setScorecards(scRes.scorecards || []);
            setSummary(scRes.summary || null);
          }
          if (notesRes) {
            setNotes(notesRes.notes || []);
          }
          if (histRes) {
            setHistory(histRes.history || []);
          }
        } catch (e) {
          console.warn("Failed to load collaboration details:", e);
        }
      };
      loadData();
    }
    return () => {
      isCancelled = true;
    };
  }, [isOpen, candidate]);

  if (!isOpen || !candidate) return null;

  const handleSubmitScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await collaborationApi.submitScorecard({
        candidate_id: candidate.id,
        technical_rating: techRating,
        communication_rating: commRating,
        problem_solving_rating: problemRating,
        culture_add_rating: cultureRating,
        overall_recommendation: recommendation,
        feedback_notes: feedbackNotes || "Comprehensive candidate evaluation completed.",
      });

      setSummary(res.summary);
      setScorecards((prev) => [res.scorecard, ...prev.filter((s) => s.id !== res.scorecard.id)]);
      addToast({
        type: "success",
        title: "Scorecard Evaluated",
        message: `Recommendation logged: ${recommendation.toUpperCase()}. Team consensus updated.`,
      });
      setActiveTab("team_reviews");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit scorecard.";
      addToast({
        type: "warning",
        title: "Evaluation Failed",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    setIsSubmittingNote(true);
    try {
      const res = await collaborationApi.createNote(candidate.id, newNoteContent.trim(), true);
      setNotes((prev) => [...prev, res.note]);
      setNewNoteContent("");
      addToast({
        type: "info",
        title: "Note Shared",
        message: "Private note added and broadcasted to team.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to post note.";
      addToast({
        type: "warning",
        title: "Error",
        message,
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const renderStars = (rating: number, onSelect?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!onSelect}
            onClick={() => onSelect && onSelect(star)}
            className={`transition-colors ${
              onSelect ? "hover:scale-110 cursor-pointer" : "cursor-default"
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                star <= rating
                  ? "text-amber-400 fill-amber-400"
                  : "text-gray-600"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-xl bg-gray-900 border-l border-gray-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800">
                Team Collaboration
              </span>
              <span className="text-xs text-gray-400">Multi-Reviewer Workspace</span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              {candidate.fullName}
            </h2>
            <p className="text-xs text-gray-400">
              {candidate.targetRole} • {candidate.college}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team Consensus Summary Banner */}
        {summary && summary.total_reviews > 0 && (
          <div className="p-3.5 bg-gray-950 border-b border-gray-800 flex items-center justify-between text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Team Verdict:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] uppercase ${
                    summary.consensus === "consensus_hire"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : summary.consensus === "consensus_reject"
                      ? "bg-red-950 text-red-300 border border-red-800"
                      : "bg-amber-950 text-amber-300 border border-amber-800"
                  }`}
                >
                  {summary.consensus.replace("_", " ")}
                </span>
                <span className="text-gray-400 text-[11px]">
                  ({summary.total_reviews} {summary.total_reviews === 1 ? "review" : "reviews"})
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                <span>Tech: <strong className="text-white">{summary.avg_technical}</strong>/5</span>
                <span>Comm: <strong className="text-white">{summary.avg_communication}</strong>/5</span>
                <span>Problem Solving: <strong className="text-white">{summary.avg_problem_solving}</strong>/5</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block">Composite</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {summary.composite_score} <span className="text-xs text-gray-500">/ 5.0</span>
              </span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 bg-gray-900/60 px-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab("evaluate")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "evaluate"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>My Evaluation</span>
          </button>
          <button
            onClick={() => setActiveTab("team_reviews")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "team_reviews"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Reviews ({scorecards.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "notes"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Private Notes ({notes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "history"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: SUBMIT EVALUATION */}
          {activeTab === "evaluate" && (
            <form onSubmit={handleSubmitScorecard} className="space-y-4">
              <div className="space-y-3 bg-gray-950 p-4 rounded-xl border border-gray-800">
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Rubric Competency Ratings (1 - 5)
                </h4>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs font-medium text-gray-200 block">Technical Depth</span>
                    <span className="text-[10px] text-gray-500">System architecture, code syntax, bug-fixing</span>
                  </div>
                  {renderStars(techRating, setTechRating)}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-850">
                  <div>
                    <span className="text-xs font-medium text-gray-200 block">Communication & Clarity</span>
                    <span className="text-[10px] text-gray-500">Articulation, rationale, active listening</span>
                  </div>
                  {renderStars(commRating, setCommRating)}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-850">
                  <div>
                    <span className="text-xs font-medium text-gray-200 block">Problem Solving & Agility</span>
                    <span className="text-[10px] text-gray-500">Handling edge cases, concurrency & bottlenecks</span>
                  </div>
                  {renderStars(problemRating, setProblemRating)}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-850">
                  <div>
                    <span className="text-xs font-medium text-gray-200 block">Culture Add & Collaboration</span>
                    <span className="text-[10px] text-gray-500">Ownership, team alignment, growth mindset</span>
                  </div>
                  {renderStars(cultureRating, setCultureRating)}
                </div>
              </div>

              {/* Recommendation Choice */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-200 uppercase tracking-wider block">
                  Overall Recommendation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "strong_hire", label: "Strong Hire", color: "border-emerald-600 bg-emerald-950/40 text-emerald-300" },
                      { id: "hire", label: "Hire", color: "border-blue-600 bg-blue-950/40 text-blue-300" },
                      { id: "neutral", label: "Neutral / Inconclusive", color: "border-amber-600 bg-amber-950/40 text-amber-300" },
                      { id: "reject", label: "Do Not Hire", color: "border-red-600 bg-red-950/40 text-red-300" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRecommendation(opt.id)}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition-all text-left flex items-center justify-between ${
                        recommendation === opt.id
                          ? opt.color + " ring-1 ring-white/20 shadow-md"
                          : "border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {recommendation === opt.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Qualitative Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-200 uppercase tracking-wider block">
                  Evaluation Feedback & Justification
                </label>
                <textarea
                  rows={4}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Summarize key strengths, specific technical deficits, and recommendation justification..."
                  className="w-full p-3 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-200 focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                <span>{isSubmitting ? "Submitting Evaluation..." : "Save & Broadcast Scorecard"}</span>
              </button>
            </form>
          )}

          {/* TAB 2: TEAM REVIEWS */}
          {activeTab === "team_reviews" && (
            <div className="space-y-3">
              {scorecards.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  No scorecards submitted yet for this candidate.
                </div>
              ) : (
                scorecards.map((sc) => (
                  <div key={sc.id} className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {sc.reviewer_name || "Recruiter"}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(sc.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                          sc.overall_recommendation === "strong_hire"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : sc.overall_recommendation === "hire"
                            ? "bg-blue-950 text-blue-300 border-blue-800"
                            : sc.overall_recommendation === "reject"
                            ? "bg-red-950 text-red-300 border-red-800"
                            : "bg-amber-950 text-amber-300 border-amber-800"
                        }`}
                      >
                        {sc.overall_recommendation.replace("_", " ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 py-1 bg-gray-900/60 p-2 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span>Technical:</span>
                        {renderStars(sc.technical_rating)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Comm:</span>
                        {renderStars(sc.communication_rating)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Problem Solving:</span>
                        {renderStars(sc.problem_solving_rating)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Culture:</span>
                        {renderStars(sc.culture_add_rating)}
                      </div>
                    </div>

                    {sc.feedback_notes && (
                      <p className="text-xs text-gray-300 italic pt-1">
                        &quot;{sc.feedback_notes}&quot;
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: PRIVATE NOTES */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-blue-950/30 p-2 rounded-lg border border-blue-900/40">
                <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Notes are private to your recruiting team and never visible to the candidate.</span>
              </div>

              {/* Notes List */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {notes.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500">
                    No private notes yet. Start the conversation below.
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-lg bg-gray-950 border border-gray-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-gray-200">{note.author_name}</span>
                        <span className="text-gray-500">{new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-gray-300 whitespace-pre-wrap">{note.note_content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Note Input */}
              <form onSubmit={handlePostNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write a private note for your team..."
                  className="flex-1 p-2.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNoteContent.trim()}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: STAGE HISTORY TIMELINE */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">
                  No stage transitions recorded yet.
                </div>
              ) : (
                history.map((h, idx) => (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      {idx < history.length - 1 && <div className="w-0.5 flex-1 bg-gray-800 my-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="font-medium text-white">
                        Moved from <strong className="text-gray-400">{h.from_stage}</strong> ➔ <strong className="text-blue-400">{h.to_stage.toUpperCase()}</strong>
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        By {h.changed_by} • {new Date(h.created_at).toLocaleString()}
                      </p>
                      {h.reason && (
                        <p className="text-[11px] text-gray-400 mt-0.5 italic">
                          Reason: {h.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
