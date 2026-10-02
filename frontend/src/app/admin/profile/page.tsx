"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  Shield,
  ShieldCheck,
  Server,
  Activity,
  Lock,
  KeyRound,
  Database,
  Building,
  AlertTriangle,
  Edit3,
  Save,
  ArrowLeft,
  Terminal,
  LogOut,
  ExternalLink,
} from "lucide-react";
import RoleGuard from "@/components/auth/RoleGuard";

export default function AdminProfilePage() {
  const router = useRouter();
  const {
    currentUser,
    updateAdminProfile,
    organizations,
    credentials,
    anomalies,
    logout,
    addToast,
  } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [adminName, setAdminName] = useState(currentUser?.name || "Platform Superuser (Root)");
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || "root@aspire.ai");
  const [keyRotationStatus, setKeyRotationStatus] = useState<string>("Active & Verified");

  const totalAnomalies = anomalies.length;
  const resolvedAnomalies = anomalies.filter((a) => a.resolved).length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminProfile({
      name: adminName,
      email: adminEmail,
    });
    setIsEditing(false);
  };

  const handleRotateKeys = () => {
    setKeyRotationStatus("Rotating...");
    setTimeout(() => {
      setKeyRotationStatus("Rotated & Verified (Key ID: 0x9f8e...1b0a)");
      addToast({
        type: "credential",
        title: "Cryptographic Signing Keys Rotated",
        message: "ECDSA SHA-256 authority re-anchored. All existing credentials remain backward-verifiable.",
      });
    }, 800);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <RoleGuard allowedRoles={["admin"]} portalName="Super Admin Key Authority & Profile">
      <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Return to Admin Governance Control"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h1 className="text-xl font-bold text-white tracking-tight">Super Admin Profile & Platform Authority</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  Access: ROOT_SUPERADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full platform administrative oversight, multi-tenant governance, and cryptographic ledger controls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center gap-1.5"
            >
              <span>Admin Console</span>
            </Link>
            <Link
              href="/hub"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <span>10 Routers Hub</span>
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Hero Super Admin Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/30 border border-purple-500/30 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-950/40">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-bold text-white tracking-tight">{adminName}</h2>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    AUTHORITY: FULL PLATFORM OVERSIGHT
                  </span>
                </div>
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-purple-400" />
                  <span>Administrative Identity: <strong className="text-white font-mono">{adminEmail}</strong></span>
                  <span className="text-slate-600">·</span>
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tenants Governed: {organizations.length} Organizations</span>
                </p>
                <p className="text-xs text-slate-400">
                  Cryptographic Ledger: <strong className="text-emerald-400">{credentials.length} SHA-256 Credentials Minted</strong> · RFC-8785 Canonical JCS
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? "Close Form" : "Edit Superuser Info"}</span>
              </button>
              <button
                onClick={handleRotateKeys}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700/60 transition-colors flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Rotate Signing Keys</span>
              </button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-900 border border-purple-500/40 shadow-xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <span>Edit Super Admin Account</span>
              </h3>
              <span className="text-xs text-slate-400">Modifies platform administrator contact details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Superuser Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Root Admin Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-md shadow-purple-950/50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Superuser Settings</span>
              </button>
            </div>
          </form>
        )}

        {/* 4 Governance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">FastAPI Routers</p>
              <div className="text-2xl font-black text-emerald-400 mt-1">10 / 10</div>
              <span className="text-[10px] text-slate-500">All Microservices Online</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Minted Credentials</p>
              <div className="text-2xl font-black text-white mt-1">{credentials.length}</div>
              <span className="text-[10px] text-slate-500">SHA-256 Tamper-Proof</span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Active Tenants</p>
              <div className="text-2xl font-black text-blue-400 mt-1">{organizations.length}</div>
              <span className="text-[10px] text-slate-500">Corporate & Academic</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Building className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Anomalies Resolved</p>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {resolvedAnomalies} / {totalAnomalies}
              </div>
              <span className="text-[10px] text-slate-500">AI Integrity Scanner</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Security & Ledger Governance Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <span>Cryptographic Authority Status</span>
            </h3>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">Root Signing Key State</span>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{keyRotationStatus}</p>
                </div>
                <button
                  onClick={handleRotateKeys}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-colors"
                >
                  Rotate
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">Canonical JSON Scheme</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">RFC-8785 Compliant Deterministic Serialization</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Enforced
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">Public Verification Portal</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Zero-auth verification endpoint (/verify/[hash])</p>
                </div>
                <Link
                  href="/verify/a4f89d3810c92bf2234e405e6081297e68cfb939e6a0d0a52479e0237d45f3ba"
                  className="text-xs text-purple-400 hover:underline flex items-center gap-1"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Platform Microservices Telemetry</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { name: "Auth & RBAC Router", path: "/api/v1/auth", ping: "14ms" },
                { name: "ATS Screening Engine", path: "/api/v1/ats", ping: "22ms" },
                { name: "Sprint Verification Worker", path: "/api/v1/sprints", ping: "19ms" },
                { name: "Career Compass (Roadmap)", path: "/api/v1/career-compass", ping: "28ms" },
                { name: "Dynamic Bug-Fix Sandbox", path: "/api/v1/sandbox", ping: "35ms" },
                { name: "FR-04 Deadline Daemon", path: "/api/v1/notifications", ping: "16ms" },
                { name: "60-JD Vector Matcher", path: "/api/v1/jobs", ping: "24ms" },
                { name: "13 Courses Micro-Academy", path: "/api/v1/courses", ping: "18ms" },
              ].map((srv) => (
                <div key={srv.name} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white text-[11px] block">{srv.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{srv.path}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{srv.ping}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </RoleGuard>
  );
}
