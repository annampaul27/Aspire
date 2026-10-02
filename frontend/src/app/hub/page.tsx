"use client";

import React from "react";
import Link from "next/link";
import BackendEngineTabs from "@/components/hub/BackendEngineTabs";


export default function BackendHubPage() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 border border-slate-800 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 font-bold text-sm">
                🧠
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Backend AI Suite & 13-Course Academy
              </h1>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                10 Routers Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Complete Next.js frontend exposure of Aspire AI’s backend intelligence: 13 Modular Courses with Timed Proctored Tests, 90-Day Career Compass, GitHub AST Codebase Verifier, AI Interview Coach, 60-JD Real-Time Matcher, and FR-04 Deadline Sweep Worker.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/demo"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md shadow-orange-500/20 transition-all"
            >
              ⚡ Live Pitch Cockpit
            </Link>
            <Link
              href="/student"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
            >
              Student Dashboard
            </Link>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] uppercase font-mono">Academy Catalog</span>
            <div className="text-xl font-bold text-white">13 Modular Courses</div>
            <p className="text-[10px] text-purple-300">LLM, AWS, Python, SQL, DSA & Web</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] uppercase font-mono">Job Description Feed</span>
            <div className="text-xl font-bold text-emerald-400">60 JDs Scanned</div>
            <p className="text-[10px] text-slate-400">Real-time candidate match %</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] uppercase font-mono">Anti-Fraud Engine</span>
            <div className="text-xl font-bold text-indigo-400">AST Codebase Audit</div>
            <p className="text-[10px] text-slate-400">Resume claim vs GitHub commits</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] uppercase font-mono">FastAPI Infrastructure</span>
            <div className="text-xl font-bold text-cyan-400">10 Routers Online</div>
            <p className="text-[10px] text-slate-400">Sub-25ms execution latency</p>
          </div>
        </div>

        {/* The 6-Tab Backend Engine Modules */}
        <BackendEngineTabs initialTab={1} />
      </div>
    </div>
  );
}
