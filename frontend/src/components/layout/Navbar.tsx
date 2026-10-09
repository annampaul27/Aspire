"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  Briefcase,
  GraduationCap,
  Shield,
  Eye,
  EyeOff,
  ChevronDown,
  Hash,
  LogIn,
  LogOut,
  CheckCircle,
  Brain,
  ShieldCheck,
  User,
  Sparkles,
  Menu,
  X,
  Sliders,
  KeyRound,
  Award,
  Crown,
} from "lucide-react";
import GithubIcon from "@/components/icons/GithubIcon";
import { RoleType } from "@/types";
import { useMounted } from "@/lib/useMounted";
import NotificationCenter from "./NotificationCenter";

export default function Navbar() {
  const mounted = useMounted();
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentOrg,
    setCurrentOrg,
    organizations,
    isAnonymizedScreening,
    setIsAnonymizedScreening,
    credentials,
    isAuthenticated,
    currentUser,
    logout,
  } = useStore();

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const orgRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (orgRef.current && !orgRef.current.contains(event.target as Node)) {
        setOrgDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  const prevPathnameRef = React.useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setMobileMenuOpen(false);
      setUserDropdownOpen(false);
      setOrgDropdownOpen(false);
    }
  }, [pathname]);

  const sampleHash =
    credentials[0]?.hash ||
    "a4f89d3810c92bf2234e405e6081297e68cfb939e6a0d0a52479e0237d45f3ba";

  // STRICT RBAC & HYDRATION SAFETY:
  // When mounted on the client with an active authenticated session, the user's role is dictated
  // by their session. During SSR and initial hydration (before mount), derive role from the route
  // so server-rendered HTML and client initial hydration match the URL exactly.
  const routeRole: RoleType =
    pathname.startsWith("/employer") || pathname === "/demo"
      ? "employer"
      : pathname.startsWith("/admin")
      ? "admin"
      : "student";

  const effectiveRole: RoleType =
    mounted && isAuthenticated && currentUser
      ? currentUser.role
      : routeRole;

  const isPublicLanding = pathname === "/" && !isAuthenticated;

  const profileUrl =
    effectiveRole === "student"
      ? "/student/profile"
      : effectiveRole === "employer"
      ? "/employer/profile"
      : "/admin/profile";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* ========================================================= */}
        {/* LEFT: BRAND & ROLE-ISOLATED PORTAL BADGE                  */}
        {/* ========================================================= */}
        <div className="flex items-center gap-4">
          <Link
            href={
              effectiveRole === "student"
                ? "/student"
                : effectiveRole === "employer"
                ? "/employer"
                : effectiveRole === "admin"
                ? "/admin"
                : "/"
            }
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-purple-950/40 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">
                Aspire <span className="text-purple-400">AI</span>
              </span>

              {/* Strict Role Badges */}
              {effectiveRole === "student" && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Student Portal</span>
                </span>
              )}
              {effectiveRole === "employer" && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Employer ATS</span>
                </span>
              )}
              {effectiveRole === "admin" && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Root Admin</span>
                </span>
              )}
            </div>
          </Link>

          {/* Employer-Only Workspace Switcher (STRICTLY HIDDEN FROM STUDENTS) */}
          {effectiveRole === "employer" && (
            <div className="relative hidden xl:block" ref={orgRef}>
              <button
                onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
                title="Switch Corporate Workspace"
              >
                <span className="text-sm leading-none">{currentOrg.logo}</span>
                <span className="max-w-[130px] truncate">{currentOrg.name}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                    orgDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {orgDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 p-1.5 shadow-2xl z-50 animate-in fade-in">
                  <div className="px-2.5 py-1.5 border-b border-slate-800 mb-1">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Hiring Workspace
                    </p>
                  </div>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        setCurrentOrg(org);
                        setOrgDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                        currentOrg.id === org.id
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">{org.logo}</span>
                        <div className="truncate">
                          <p className="font-semibold truncate">{org.name}</p>
                          <p className="text-[10px] text-slate-500 capitalize">
                            {org.type} · {org.plan}
                          </p>
                        </div>
                      </div>
                      {currentOrg.id === org.id && (
                        <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* CENTER: ROLE-SPECIFIC NAVIGATION BAR                      */}
        {/* ========================================================= */}
        <nav className="hidden md:flex items-center gap-1">
          {/* 1. STUDENT NAVIGATION (Clean & Student-Focused) */}
          {effectiveRole === "student" && (
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
              <Link
                href="/student"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/student"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                <span>My Dashboard</span>
              </Link>

              <Link
                href="/hub"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/hub"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span>13 Courses & Labs</span>
              </Link>

              <Link
                href="/student/github-security"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/student/github-security"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>GitHub Secret Shield</span>
              </Link>

              <Link
                href="/student/profile"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/student/profile"
                    ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Award className="w-3.5 h-3.5 text-purple-300" />
                <span>My Credentials</span>
              </Link>

              <Link
                href="/pricing"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/pricing" || pathname === "/revenue"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-amber-400 hover:text-amber-300 hover:bg-slate-800/60"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Pro (₹299)</span>
              </Link>
            </div>
          )}

          {/* 2. EMPLOYER NAVIGATION (Screening & Candidate Sprints) */}
          {effectiveRole === "employer" && (
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
              <Link
                href="/employer"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/employer"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>Talent Radar & Pipeline</span>
              </Link>

              <Link
                href="/github-analysis"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/github-analysis"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <GithubIcon className="w-3.5 h-3.5 text-purple-300" />
                <span>Candidate AST Auditor</span>
              </Link>

              <Link
                href="/hub"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/hub"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>60-JD Vector Matcher</span>
              </Link>

              <Link
                href="/employer/profile"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/employer/profile"
                    ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-blue-300" />
                <span>Hiring Preferences</span>
              </Link>

              <Link
                href="/pricing"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/pricing" || pathname === "/revenue"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Pricing & Plans</span>
              </Link>
            </div>
          )}

          {/* 3. ADMIN NAVIGATION (Platform Governance & Security) */}
          {effectiveRole === "admin" && (
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/admin"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Governance Console</span>
              </Link>

              <Link
                href="/admin/profile"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/admin/profile"
                    ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                <span>Key Authority & Telemetry</span>
              </Link>

              <Link
                href={`/verify/${sampleHash}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
              >
                <Hash className="w-3.5 h-3.5 text-blue-400" />
                <span>Public Ledger Verify</span>
              </Link>
            </div>
          )}

          {/* 4. PUBLIC LANDING NAVIGATION */}
          {isPublicLanding && (
            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
              <Link href="/employer" className="hover:text-white transition-colors">
                For Employers
              </Link>
              <Link href="/student" className="hover:text-white transition-colors">
                For Students
              </Link>
              <Link href="/hub" className="hover:text-white transition-colors">
                Courses & AI Suite
              </Link>
              <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">
                Pricing & Revenue
              </Link>
              <Link href={`/verify/${sampleHash}`} className="hover:text-white transition-colors">
                Verify Credential
              </Link>
            </div>
          )}
        </nav>

        {/* ========================================================= */}
        {/* RIGHT: CONTEXTUAL ACTIONS, COCKPIT & USER PROFILE         */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2.5">
          {/* Employer/Admin-Only Live Pitch Cockpit Beacon (HIDDEN FROM STUDENTS) */}
          {effectiveRole !== "student" && (
            <Link
              href="/demo"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                pathname === "/demo"
                  ? "bg-amber-500 text-slate-950 ring-2 ring-amber-400/50 shadow-amber-500/20"
                  : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
              title="Open ATS Screening Cockpit"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>Live Pitch</span>
            </Link>
          )}

          {/* Contextual Blind Screening Toggle (ONLY shown on Employer portal) */}
          {effectiveRole === "employer" && (
            <button
              onClick={() => setIsAnonymizedScreening(!isAnonymizedScreening)}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                isAnonymizedScreening
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Toggle Blind Merit Screening Mode (E17 Standard)"
            >
              {isAnonymizedScreening ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">Blind: ON</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Blind: OFF</span>
                </>
              )}
            </button>
          )}

          {/* Notification Center */}
          <NotificationCenter userId={effectiveRole === "student" ? "cand-1" : "emp-1"} />

          {/* Authenticated User Menu (STRICT ROLE PROFILE - NO ACCIDENTAL ROLE SWITCHER) */}
          {mounted && isAuthenticated && currentUser ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
                title="Account Menu"
              >
                {currentUser.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-lg object-cover ring-1 ring-purple-500/30"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {currentUser.name[0]}
                  </div>
                )}
                <span className="hidden sm:inline font-semibold text-white text-xs max-w-[100px] truncate">
                  {currentUser.name.split(" ")[0]}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-500 transition-transform ${
                    userDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 p-2 shadow-2xl z-50 space-y-1.5 animate-in fade-in">
                  {/* User Identity Header */}
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                    
                    {/* Role Pill */}
                    <div className="mt-1.5">
                      {currentUser.role === "student" ? (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <GraduationCap className="w-3 h-3" />
                          <span>Student Account</span>
                        </span>
                      ) : currentUser.role === "employer" ? (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          <Briefcase className="w-3 h-3" />
                          <span>Recruiter / ATS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          <Shield className="w-3 h-3" />
                          <span>Root Super Admin</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profile Direct Link */}
                  <Link
                    href={profileUrl}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>My Profile & Settings</span>
                  </Link>

                  <Link
                    href="/pricing"
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-amber-300 hover:text-amber-200 hover:bg-slate-800 transition-colors font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Monetization & Plans</span>
                  </Link>

                  {/* Additional Role-Specific Quick Links */}
                  {currentUser.role === "student" && (
                    <>
                      <Link
                        href="/student/github-security"
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>GitHub Secret Shield</span>
                      </Link>
                      <Link
                        href="/student"
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Skill Gap Radar</span>
                      </Link>
                    </>
                  )}

                  {currentUser.role === "employer" && (
                    <Link
                      href="/employer"
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                      <span>Talent Radar & Pipeline</span>
                    </Link>
                  )}

                  {currentUser.role === "admin" && (
                    <Link
                      href="/admin"
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      <span>Governance Dashboard</span>
                    </Link>
                  )}

                  {/* Sign Out (Clears session, prevents student from carrying session into employer) */}
                  <button
                    onClick={() => {
                      logout();
                      router.push("/login");
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors border-t border-slate-800/80 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : mounted ? (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-950/40 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          ) : (
            <div className="h-8 w-24 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE EXPANDED ROLE DRAWER                               */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-3 animate-in slide-in-from-top">
          {effectiveRole === "student" && (
            <div className="space-y-1.5">
              <Link
                href="/student"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 text-xs font-semibold text-white"
              >
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>My Dashboard</span>
              </Link>
              <Link
                href="/hub"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 text-xs font-semibold text-slate-300"
              >
                <Brain className="w-4 h-4 text-purple-400" />
                <span>13 Courses & Labs</span>
              </Link>
              <Link
                href="/student/github-security"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 text-xs font-semibold text-slate-300"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>GitHub Secret Shield</span>
              </Link>
              <Link
                href="/student/profile"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 text-xs font-semibold text-slate-300"
              >
                <Award className="w-4 h-4 text-purple-300" />
                <span>My Credentials</span>
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs font-semibold text-purple-300"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Pro Upskilling (₹299/mo)</span>
              </Link>
            </div>
          )}

          {effectiveRole === "employer" && (
            <div className="space-y-1.5">
              <Link
                href="/employer"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 text-xs font-semibold text-white"
              >
                <Briefcase className="w-4 h-4 text-blue-400" />
                <span>Talent Radar & Pipeline</span>
              </Link>
              <Link
                href="/github-analysis"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 text-xs font-semibold text-slate-300"
              >
                <GithubIcon className="w-4 h-4 text-purple-400" />
                <span>Candidate AST Auditor</span>
              </Link>
              <Link
                href="/employer/profile"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 text-xs font-semibold text-slate-300"
              >
                <Sliders className="w-4 h-4 text-blue-300" />
                <span>Hiring Preferences</span>
              </Link>
            </div>
          )}

          {effectiveRole === "admin" && (
            <div className="space-y-1.5">
              <Link
                href="/admin"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 text-xs font-semibold text-white"
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Governance Console</span>
              </Link>
              <Link
                href="/admin/profile"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 text-xs font-semibold text-slate-300"
              >
                <KeyRound className="w-4 h-4 text-purple-400" />
                <span>Key Authority & Telemetry</span>
              </Link>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
            {effectiveRole !== "student" && (
              <Link
                href="/demo"
                className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 text-amber-300 font-bold"
              >
                <span>⚡ Live Pitch Cockpit</span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </Link>
            )}
            {mounted && isAuthenticated ? (
              <Link
                href={profileUrl}
                className="flex items-center justify-between p-2 rounded-lg text-slate-300 hover:bg-slate-900"
              >
                <span>👤 My Profile & Settings</span>
                <ChevronDown className="w-4 h-4 -rotate-90 text-slate-600" />
              </Link>
            ) : mounted ? (
              <Link
                href="/login"
                className="flex items-center justify-between p-2 rounded-lg bg-purple-600 text-white font-semibold"
              >
                <span>🔑 Sign In / Register</span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
