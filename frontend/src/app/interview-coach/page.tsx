"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Mic, Video, ShieldCheck } from "lucide-react";
import LiveInterviewStage from "@/components/interview/LiveInterviewStage";

export default function InterviewCoachPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/student"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Student Dashboard
            </Link>
            <div className="h-4 w-px bg-gray-800" />
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Mic className="h-4 w-4" />
              </span>
              <h1 className="text-base font-bold tracking-tight">AI Interview Coach Studio</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 font-semibold text-emerald-400 flex items-center gap-1">
              <Video className="h-3.5 w-3.5" /> Multimodal Video & Audio
            </span>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 font-semibold text-blue-400 hidden sm:flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> CHI Evaluation Engine
            </span>
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Real-Time Technical Interview Simulator
          </h2>
          <p className="mt-1 text-sm text-gray-400 max-w-3xl">
            Practice challenging technical scenarios with adaptive follow-up grilling. The AI coach tracks
            your speaking pace (WPM), filler word habits, eye-contact engagement, and architectural depth in real time.
          </p>
        </div>

        <LiveInterviewStage />
      </main>
    </div>
  );
}
