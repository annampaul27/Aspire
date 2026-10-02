"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  Briefcase,
  GraduationCap,
  Shield,
  ArrowRight,
  ShieldCheck,
  Award,
  Lock,
  Cpu,
  Zap,
  LogIn,
} from "lucide-react";

export default function HomePage() {
  const { credentials, isAuthenticated, currentUser } = useStore();

  const sampleHash =
    credentials[0]?.hash ||
    "a4f89d3810c92bf2234e405e6081297e68cfb939e6a0d0a52479e0237d45f3ba";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Hero */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-8 sm:p-12">
        <div className="max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Verifiable Skills Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            Verified talent matching,{" "}
            <span className="text-blue-400">powered by AI</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-xl">
            Aspire AI connects employers with job-ready candidates through
            verified skill assessments, structured micro-learning, and
            tamper-proof credentials — eliminating resume noise and bridging
            skill gaps.
          </p>

          {/* Role-Aware Primary Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {isAuthenticated && currentUser?.role === "student" ? (
              <>
                <Link
                  href="/student"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-950/60"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>My Student Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/student/profile"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white transition-colors"
                >
                  <Award className="w-4 h-4 text-purple-400" />
                  <span>My Verified Credentials</span>
                </Link>

                <Link
                  href="/hub"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>13 Courses & Labs</span>
                </Link>
              </>
            ) : isAuthenticated && currentUser?.role === "employer" ? (
              <>
                <Link
                  href="/employer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-950/60"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Employer ATS Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/employer/profile"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white transition-colors"
                >
                  <span>Hiring Preferences</span>
                </Link>

                <Link
                  href="/demo"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                >
                  <span>⚡ Live Evaluation</span>
                </Link>
              </>
            ) : isAuthenticated && currentUser?.role === "admin" ? (
              <>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-950/60"
                >
                  <Shield className="w-4 h-4" />
                  <span>Governance Console</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/admin/profile"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white transition-colors"
                >
                  <span>Key Authority & Telemetry</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white transition-all shadow-lg shadow-purple-950/60"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Register</span>
                </Link>

                <Link
                  href="/student"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <span>For Students</span>
                </Link>

                <Link
                  href="/employer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>For Employers</span>
                </Link>

                <Link
                  href={`/verify/${sampleHash}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Credential</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Employer */}
        <Link
          href="/employer"
          className="group p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                Employer & Recruiter
              </h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Parse job descriptions, match candidates by skill fit, dispatch
                micro-assessments, and verify credentials — all from one dashboard.
              </p>
            </div>

            <ul className="space-y-1.5 pt-1 text-[11px] text-gray-400">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400" />
                Gap sprint dispatch
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400" />
                Credential verification audit
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400" />
                Blind merit-based screening
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400" />
                University cohort analytics
              </li>
            </ul>
          </div>

          <div className="pt-5 mt-4 border-t border-gray-800 flex items-center justify-between text-xs font-medium text-blue-400">
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Student */}
        <Link
          href="/student"
          className="group p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors">
                Student & Learner
              </h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Identify skill gaps against live job roles, complete timed
                micro-challenges, earn verifiable credentials, and track
                your readiness.
              </p>
            </div>

            <ul className="space-y-1.5 pt-1 text-[11px] text-gray-400">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                Skill gap analysis
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                Timed assessments with anti-cheat
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                Verified credential minting
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                Application readiness roadmap
              </li>
            </ul>
          </div>

          <div className="pt-5 mt-4 border-t border-gray-800 flex items-center justify-between text-xs font-medium text-emerald-400">
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Admin */}
        <Link
          href="/admin"
          className="group p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white group-hover:text-purple-400 transition-colors">
                Admin & Institutional
              </h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Manage the credential ledger, maintain skill taxonomies,
                oversee multi-tenant organizations, and monitor platform
                integrity.
              </p>
            </div>

            <ul className="space-y-1.5 pt-1 text-[11px] text-gray-400">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-purple-400" />
                Credential ledger
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-purple-400" />
                Skill taxonomy management
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-purple-400" />
                Organization management
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-purple-400" />
                Fraud detection
              </li>
            </ul>
          </div>

          <div className="pt-5 mt-4 border-t border-gray-800 flex items-center justify-between text-xs font-medium text-purple-400">
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Platform Highlights */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-7 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Platform Architecture
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Built for performance, security, and scale.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-800 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-400">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-medium text-white">Fast Processing</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              Sub-3s skill gap computation with offline cache fallback for
              uninterrupted workflows.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span className="font-medium text-white">Tamper-Proof Credentials</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              SHA-256 hashing over canonical payloads ensures credential
              authenticity without vendor lock-in.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-800 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400">
              <Cpu className="w-3.5 h-3.5" />
              <span className="font-medium text-white">Multi-Tenant Isolation</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              Complete data partitioning across corporate, staffing, and
              university workspaces.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
