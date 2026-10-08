"use client";

import React from "react";
import { Gauge, Eye, MessageSquare, AlertTriangle, ShieldCheck } from "lucide-react";

interface SpeechTelemetryHUDProps {
  wpm: number;
  cadenceRating: string;
  fillerCount: number;
  detectedFillers: string[];
  eyeContactPercent: number;
  headStabilityScore: number;
  elapsedSeconds: number;
  isRecording: boolean;
}

export default function SpeechTelemetryHUD({
  wpm,
  cadenceRating,
  fillerCount,
  detectedFillers,
  eyeContactPercent,
  headStabilityScore,
  elapsedSeconds,
  isRecording,
}: SpeechTelemetryHUDProps) {
  const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const secs = String(elapsedSeconds % 60).padStart(2, "0");

  const getPacingColor = () => {
    if (cadenceRating === "Optimal") return "text-emerald-400 bg-emerald-950/40 border-emerald-800/60";
    if (cadenceRating.includes("Slow")) return "text-blue-400 bg-blue-950/40 border-blue-800/60";
    return "text-amber-400 bg-amber-950/40 border-amber-800/60";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-950/80 border border-gray-800/80 backdrop-blur-md rounded-xl p-3.5 shadow-xl text-white">
      {/* 1. Speaking Cadence / WPM */}
      <div className="flex flex-col gap-1 rounded-lg bg-gray-900/60 border border-gray-800/60 p-2.5">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1 font-medium">
            <Gauge className="h-3.5 w-3.5 text-blue-400" /> Speaking Rate
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPacingColor()}`}>
            {cadenceRating}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-xl font-extrabold tracking-tight text-white">{wpm}</span>
          <span className="text-xs text-gray-400 font-medium">WPM</span>
        </div>
        <span className="text-[10px] text-gray-500">Optimal: 120-165 WPM</span>
      </div>

      {/* 2. Filler Word Tics */}
      <div className="flex flex-col gap-1 rounded-lg bg-gray-900/60 border border-gray-800/60 p-2.5">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1 font-medium">
            <MessageSquare className="h-3.5 w-3.5 text-amber-400" /> Filler Words
          </span>
          {fillerCount > 4 ? (
            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
              <AlertTriangle className="h-3 w-3" /> High
            </span>
          ) : (
            <span className="text-[10px] text-emerald-400 font-semibold">Low</span>
          )}
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-xl font-extrabold tracking-tight text-white">{fillerCount}</span>
          <span className="text-xs text-gray-400">tics</span>
        </div>
        <span className="text-[10px] text-gray-500 truncate" title={detectedFillers.join(", ")}>
          {detectedFillers.length > 0 ? detectedFillers.slice(0, 3).join(", ") : "None detected"}
        </span>
      </div>

      {/* 3. Eye-Contact Engagement */}
      <div className="flex flex-col gap-1 rounded-lg bg-gray-900/60 border border-gray-800/60 p-2.5">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1 font-medium">
            <Eye className="h-3.5 w-3.5 text-emerald-400" /> Eye Contact
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold">Gaze Lock</span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-xl font-extrabold tracking-tight text-emerald-400">{eyeContactPercent}%</span>
          <span className="text-xs text-gray-400">ratio</span>
        </div>
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${eyeContactPercent}%` }}
          />
        </div>
      </div>

      {/* 4. Head Stability & Time */}
      <div className="flex flex-col gap-1 rounded-lg bg-gray-900/60 border border-gray-800/60 p-2.5">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" /> Poise & Timer
          </span>
          <span className="font-mono text-xs font-bold text-amber-400">
            {isRecording ? `${mins}:${secs}` : "Idle"}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-xl font-extrabold tracking-tight text-white">{headStabilityScore}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
        <span className="text-[10px] text-gray-500">Postural Stability</span>
      </div>
    </div>
  );
}
