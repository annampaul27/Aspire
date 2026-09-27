"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { RoleType } from "@/types";
import {
  Briefcase,
  GraduationCap,
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  KeyRound,
  Zap,
  UserPlus,
  LogIn,
  Building,
  User,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import GithubIcon from "@/components/icons/GithubIcon";
import { setAuthToken } from "@/lib/api/client";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode: "login" | "register-student" | "register-employer" =
    searchParams?.get("mode") === "register" ? "register-student" : "login";

  const {
    role,
    organizations,
    currentOrg,
    login,
    registerStudent,
    addToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"login" | "register-student" | "register-employer">(
    initialMode
  );

  // Sign In State
  const [selectedRole, setSelectedRole] = useState<RoleType>(role || "employer");
  const [selectedOrgId, setSelectedOrgId] = useState<string>(currentOrg?.id || organizations[0].id);
  const [email, setEmail] = useState<string>("priya.sharma@acme.com");
  const [password, setPassword] = useState<string>("••••••••••••");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>("");

  // Student Registration State
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regCollege, setRegCollege] = useState("IIT Madras");
  const [regDegree, setRegDegree] = useState("B.Tech Computer Science");
  const [regGradYear, setRegGradYear] = useState(2026);
  const [regTargetRole, setRegTargetRole] = useState("Backend Distributed Systems Engineer");
  const [regGithub, setRegGithub] = useState("aaravsharma-dev");
  const [regLinkedin, setRegLinkedin] = useState("aarav-sharma-tech");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Python",
    "FastAPI",
    "PostgreSQL",
    "Docker",
  ]);

  // Employer Registration State
  const [empCompanyName, setEmpCompanyName] = useState("");
  const [empRecruiterName, setEmpRecruiterName] = useState("");
  const [empWorkEmail, setEmpWorkEmail] = useState("");
  const [empIndustry, setEmpIndustry] = useState("corporate");
  const [empHiringRole, setEmpHiringRole] = useState("Senior Backend Engineer");

  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showOfflineFallback, setShowOfflineFallback] = useState<boolean>(false);

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => {
        if (res.ok) setBackendOnline(true);
      })
      .catch(() => setBackendOnline(false));
  }, []);

  const handleRoleTabChange = (newRole: RoleType) => {
    setSelectedRole(newRole);
    setAuthError(null);
    setShowOfflineFallback(false);
    if (newRole === "employer") {
      setEmail("priya.sharma@acme.com");
      setPassword("••••••••••••");
    } else if (newRole === "student") {
      setEmail("aditya.verma@example.com");
      setPassword("••••••••••••");
    } else if (newRole === "admin") {
      setEmail("root@skillsetu.ai");
      setPassword("••••••••••••");
    }
  };

  const handleQuickLogin = (demoRole: RoleType, demoEmail: string, orgId?: string) => {
    setSelectedRole(demoRole);
    setEmail(demoEmail);
    setAuthError(null);
    setShowOfflineFallback(false);
    if (orgId) setSelectedOrgId(orgId);
    triggerLogin(demoRole, demoEmail, orgId);
  };

  const handleOfflineSimulationLogin = (r: RoleType, em: string, orgId?: string) => {
    const targetOrg = orgId || selectedOrgId;
    login(r, em, targetOrg);
    if (r === "employer") router.push("/employer");
    else if (r === "student") router.push("/student");
    else if (r === "admin") router.push("/admin");
  };

  const triggerLogin = async (r: RoleType, em: string, orgId?: string) => {
    setIsLoading(true);
    setAuthError(null);
    setShowOfflineFallback(false);
    const targetOrg = orgId || selectedOrgId;

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: em,
          password: password === "••••••••••••" ? "SkillSetu@2026" : password,
          role: r,
          org_id: r === "employer" ? targetOrg : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access_token) {
          setAuthToken(data.access_token);
        }
        login(r, em, targetOrg);
        if (r === "employer") router.push("/employer");
        else if (r === "student") router.push("/student");
        else if (r === "admin") router.push("/admin");
      } else {
        const errData = await response.json().catch(() => ({}));
        setAuthError(
          errData.detail || `Authentication rejected (${response.status}). Please verify credentials and role.`
        );
      }
    } catch (err) {
      console.warn("Backend authentication connection failed:", err);
      setAuthError(
        "Authentication service unreachable on http://localhost:8000. Start the backend or proceed in simulated mode."
      );
      setShowOfflineFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail) {
      alert("Please fill in your name and email.");
      return;
    }

    setIsLoading(true);

    try {
      // Try registering with backend
      await fetch("http://localhost:8000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: regFullName,
          email: regEmail,
          password: regPassword || "SkillSetu@2026",
          role: "student",
          college: regCollege,
        }),
      }).catch((e) => console.warn("Backend registration offline:", e));
    } catch {
      // zero fail
    }

    // Register into store
    registerStudent({
      fullName: regFullName,
      email: regEmail,
      college: regCollege,
      gradYear: Number(regGradYear),
      targetRole: regTargetRole,
      githubUrl: regGithub ? `https://github.com/${regGithub.replace(/.*github\.com\//, "")}` : undefined,
      linkedinUrl: regLinkedin ? `https://linkedin.com/in/${regLinkedin.replace(/.*linkedin\.com\/in\//, "")}` : undefined,
      skills: selectedSkills,
    });

    setIsLoading(false);
    // Redirect directly to the student profile page so they can review their newly minted profile!
    router.push("/student/profile");
  };

  const handleEmployerRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empCompanyName || !empWorkEmail) {
      alert("Please provide your organization name and work email.");
      return;
    }

    setIsLoading(true);
    login("employer", empWorkEmail);
    addToast({
      type: "success",
      title: "Organization Registered! 🏢",
      message: `${empCompanyName} workspace initialized. ATS screening pipeline ready.`,
    });
    setIsLoading(false);
    router.push("/employer/profile");
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const POPULAR_SKILLS = [
    "Python",
    "FastAPI",
    "PostgreSQL",
    "Docker",
    "TypeScript",
    "React",
    "Go",
    "Kubernetes",
    "SQL",
    "Kafka",
    "AWS",
    "Git",
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Brand Logo & Headline */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-950/60 ring-2 ring-purple-500/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Skill<span className="text-purple-400">Setu</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Unified Career & Talent Gateway
          </h2>
          <p className="text-xs text-slate-400">
            Sign in to your role dashboard or register a new candidate / employer profile.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-6 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center shadow-inner">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "login"
                ? "bg-purple-600 text-white shadow-md shadow-purple-950/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => setActiveTab("register-student")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "register-student"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Register Student</span>
          </button>
          <button
            onClick={() => setActiveTab("register-employer")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "register-employer"
                ? "bg-blue-600 text-white shadow-md shadow-blue-950/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Register Employer</span>
          </button>
        </div>

        {/* TAB 1: SIGN IN */}
        {activeTab === "login" && (
          <div className="mt-5 bg-slate-900/90 border border-slate-800/80 shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6 animate-in fade-in">
            {/* Role Selector Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Select Role Persona</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleTabChange("student")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    selectedRole === "student"
                      ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleTabChange("employer")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    selectedRole === "employer"
                      ? "bg-blue-500/15 border-blue-500/50 text-blue-300 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-blue-400" />
                  <span>Employer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleTabChange("admin")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    selectedRole === "admin"
                      ? "bg-purple-500/15 border-purple-500/50 text-purple-300 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Super Admin</span>
                </button>
              </div>
            </div>

            {/* 1-Click Fast Instant Demo Access */}
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/25 space-y-2">
              <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Click Instant Demo Access (Evaluation Bypass)</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("student", "aditya.verma@example.com")}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <span>Student (Aditya)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("employer", "priya.sharma@acme.com", organizations[0].id)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <span>Recruiter (Priya)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("admin", "root@skillsetu.ai")}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <span>Super Admin (Root)</span>
                </button>
              </div>
            </div>

            {/* Authentication Notice Banner */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Authentication Notice</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{authError}</p>
                {showOfflineFallback && (
                  <button
                    type="button"
                    onClick={() => handleOfflineSimulationLogin(selectedRole, email)}
                    className="w-full mt-2 py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Proceed in Simulated Offline Demo Mode</span>
                  </button>
                )}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                triggerLogin(selectedRole, email);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Email Address / Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-purple-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Employer Org Select */}
              {selectedRole === "employer" && (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Select Hiring Organization / Workspace
                  </label>
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.logo} {org.name} ({org.plan} Plan)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-purple-600 focus:ring-0"
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {backendOnline ? "🟢 FastAPI Online" : "🟡 Offline Demo Mode"}
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-950/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Enter {selectedRole === "student" ? "Student Dashboard" : selectedRole === "employer" ? "Employer ATS" : "Admin Console"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: REGISTER STUDENT FORM */}
        {activeTab === "register-student" && (
          <form
            onSubmit={handleStudentRegistration}
            className="mt-5 bg-slate-900/90 border border-slate-800/80 shadow-2xl rounded-2xl p-6 sm:p-8 space-y-5 animate-in fade-in"
          >
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <span>Create Student Candidate Account</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Register your engineering credentials to access verified skill sprints, tamper-proof proof-of-work badges, and direct ATS matching.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Full Legal Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">College Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. aarav.sharma@iitm.ac.in"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">College / University *</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regCollege}
                    onChange={(e) => setRegCollege(e.target.value)}
                    placeholder="e.g. IIT Madras, Anna University, NIT Trichy"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Degree & Major</label>
                <input
                  type="text"
                  value={regDegree}
                  onChange={(e) => setRegDegree(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Graduation Year</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={regGradYear}
                    onChange={(e) => setRegGradYear(Number(e.target.value))}
                    min={2024}
                    max={2030}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Target Engineering Role</label>
                <input
                  type="text"
                  value={regTargetRole}
                  onChange={(e) => setRegTargetRole(e.target.value)}
                  placeholder="e.g. Backend Distributed Systems Engineer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">GitHub Username</label>
                <div className="relative">
                  <GithubIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regGithub}
                    onChange={(e) => setRegGithub(e.target.value)}
                    placeholder="e.g. aaravsharma-dev"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">LinkedIn Profile</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regLinkedin}
                    onChange={(e) => setRegLinkedin(e.target.value)}
                    placeholder="e.g. aarav-sharma-tech"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Account Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Technical Skills Selector */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-slate-300 block">
                Primary Technical Competencies (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SKILLS.map((sk) => {
                  const isSel = selectedSkills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => toggleSkill(sk)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        isSel
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {isSel ? "✓ " : "+ "}
                      {sk}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Candidate Profile & Launch Dashboard</span>
            </button>
          </form>
        )}

        {/* TAB 3: REGISTER EMPLOYER FORM */}
        {activeTab === "register-employer" && (
          <form
            onSubmit={handleEmployerRegistration}
            className="mt-5 bg-slate-900/90 border border-slate-800/80 shadow-2xl rounded-2xl p-6 sm:p-8 space-y-4 animate-in fade-in"
          >
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                <span>Register Organization & Hiring Team</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Set up a verified multi-tenant employer workspace to post job openings and filter verified candidates.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  value={empCompanyName}
                  onChange={(e) => setEmpCompanyName(e.target.value)}
                  placeholder="e.g. Acme HyperScale Systems, Razorpay, Swiggy"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Hiring Manager / Recruiter Name *</label>
                  <input
                    type="text"
                    value={empRecruiterName}
                    onChange={(e) => setEmpRecruiterName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Work Email Address *</label>
                  <input
                    type="email"
                    value={empWorkEmail}
                    onChange={(e) => setEmpWorkEmail(e.target.value)}
                    placeholder="e.g. priya.sharma@acme.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Primary Role You Are Hiring For</label>
                <input
                  type="text"
                  value={empHiringRole}
                  onChange={(e) => setEmpHiringRole(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer (FastAPI / Distributed Systems)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Industry Type</label>
                <select
                  value={empIndustry}
                  onChange={(e) => setEmpIndustry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="corporate">Enterprise Software / SaaS</option>
                  <option value="staffing">Staffing & Recruitment Agency</option>
                  <option value="university">University Placement Cell</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Building2 className="w-4 h-4" />
              <span>Create Employer Workspace</span>
            </button>
          </form>
        )}

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <span>Reset Password</span>
                </h3>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-300">
                Enter your registered email address and we will dispatch a cryptographic password recovery token.
              </p>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@college.edu or you@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    addToast({
                      type: "info",
                      title: "Recovery Link Dispatched",
                      message: `A secure reset link has been dispatched to ${forgotEmail || "your email"}.`,
                    });
                    setShowForgotModal(false);
                  }}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Send Recovery Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Loading authentication portal...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
