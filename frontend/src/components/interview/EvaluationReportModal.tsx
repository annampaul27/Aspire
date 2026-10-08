"use client";

import React from "react";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Sparkles,
  BarChart3,
  X,
  Volume2,
  Eye,
  Brain,
} from "lucide-react";
import { HireabilityEvaluationReport } from "@/lib/api/interviewCoach";

interface EvaluationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: HireabilityEvaluationReport | null;
}

export default function EvaluationReportModal({
  isOpen,
  onClose,
  report,
}: EvaluationReportModalProps) {
  if (!isOpen || !report) return null;

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Aspire_AI_Evaluation_${report.report_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getVerdictBadge = (verdict: string) => {
    if (verdict === "Strong Hire") {
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    } else if (verdict === "Hire") {
      return "bg-teal-500/20 text-teal-400 border-teal-500/50";
    } else if (verdict === "Leaning Hire") {
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    } else {
      return "bg-amber-500/20 text-amber-400 border-amber-500/50";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-800 bg-gray-950 p-6 md:p-8 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-2 text-gray-400 hover:bg-gray-900 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Official Multi-Modal Scorecard
              </span>
              <span className="text-xs text-gray-400">ID: {report.report_id}</span>
            </div>
            <h2 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">
              AI Interview Evaluation Report
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Evaluated Candidate: <strong className="text-white">{report.candidate_name}</strong> for{" "}
              <strong className="text-emerald-400">{report.role}</strong>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900 px-3.5 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800"
            >
              <Download className="h-4 w-4" /> Export JSON
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900 px-3.5 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>
        </div>

        {/* Primary Banner: Composite Hireability Score */}
        <div className="mt-6 rounded-2xl border border-emerald-900/50 bg-gradient-to-r from-emerald-950/40 via-gray-900/60 to-gray-950 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 shadow-lg shadow-emerald-950">
              <Award className="h-10 w-10 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Composite Hireability Index (CHI)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl md:text-5xl font-black text-white">
                  {report.overall_hireability_score}
                </span>
                <span className="text-sm font-semibold text-gray-400">/ 100</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Formula: 50% Technical + 25% Vocal Pacing + 25% Gaze Composure
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <span className="text-xs text-gray-400 uppercase font-semibold mb-1">Committee Verdict</span>
            <span
              className={`rounded-full border px-5 py-2 text-base font-extrabold shadow-lg ${getVerdictBadge(
                report.verdict
              )}`}
            >
              {report.verdict}
            </span>
          </div>
        </div>

        {/* Sub-Score Pillar Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Technical Depth */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span className="flex items-center gap-1.5 font-bold uppercase text-emerald-400">
                <Brain className="h-4 w-4" /> Technical Accuracy
              </span>
              <span className="text-gray-400 font-mono">Weight: 50%</span>
            </div>
            <div className="text-2xl font-black text-white">{report.technical_score} / 100</div>
            <div className="mt-2 text-xs text-gray-400">
              Evaluated against architectural criteria & domain edge cases.
            </div>
          </div>

          {/* 2. Vocal Acoustics */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span className="flex items-center gap-1.5 font-bold uppercase text-blue-400">
                <Volume2 className="h-4 w-4" /> Vocal Delivery
              </span>
              <span className="text-gray-400 font-mono">Weight: 25%</span>
            </div>
            <div className="text-2xl font-black text-white">{report.vocal_score} / 100</div>
            <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
              <span>{report.speech_metrics.wpm} WPM ({report.speech_metrics.cadence_rating})</span>
              <span>{report.speech_metrics.filler_word_count} fillers</span>
            </div>
          </div>

          {/* 3. Non-Verbal Composure */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span className="flex items-center gap-1.5 font-bold uppercase text-purple-400">
                <Eye className="h-4 w-4" /> Non-Verbal Poise
              </span>
              <span className="text-gray-400 font-mono">Weight: 25%</span>
            </div>
            <div className="text-2xl font-black text-white">{report.nonverbal_score} / 100</div>
            <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
              <span>{Math.round(report.vision_metrics.eye_contact_ratio * 100)}% Eye Contact</span>
              <span>Stability: {report.vision_metrics.head_stability_index}/100</span>
            </div>
          </div>
        </div>

        {/* Competency Radar Breakdown */}
        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            Competency Radar Telemetry
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(report.radar_chart_data).map(([dim, val]) => (
              <div key={dim} className="rounded-lg bg-gray-950 border border-gray-800 p-3 text-center">
                <span className="text-[11px] font-semibold text-gray-400 block truncate" title={dim}>
                  {dim}
                </span>
                <span className="text-lg font-black text-white mt-1 block">{val}</span>
                <div className="mt-2 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${Math.min(100, val)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* What Went Well */}
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-5">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4" /> Observed Technical Strengths
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              {report.what_went_well.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actionable Improvements */}
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-5">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4" /> Actionable Improvements & Blindspots
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              {report.what_to_improve.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Model Senior Response */}
        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/80 p-5">
          <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-emerald-400" /> Model Senior-Level Response
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed font-mono bg-black/40 p-3.5 rounded-lg border border-gray-800/80">
            {report.model_senior_response}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-800 px-6 py-2.5 text-sm font-bold text-white hover:bg-gray-700"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
