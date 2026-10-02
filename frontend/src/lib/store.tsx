"use client";

import React, { createContext, useContext, useState } from "react";
import {
  RoleType,
  Organization,
  JobOpening,
  Candidate,
  ProofOfWorkCredential,
  AnomalyLog,
  ReadinessTier,
} from "@/types";
import {
  INITIAL_ORGS,
  INITIAL_JOBS,
  INITIAL_CREDENTIALS,
  INITIAL_TAXONOMY,
  INITIAL_ANOMALIES,
} from "./mockData";
import { CAMPUS_25_CANDIDATES } from "./campusCandidatesSeed";
import { computeSHA256, canonicalizeJSON } from "./crypto";
import { clearAuthToken } from "./api/client";

export interface ToastNotification {
  id: string;
  type: "success" | "warning" | "info" | "credential";
  title: string;
  message: string;
  timestamp: string;
}

interface StoreContextType {
  role: RoleType;
  setRole: (role: RoleType) => void;
  currentOrg: Organization;
  setCurrentOrg: (org: Organization) => void;
  organizations: Organization[];
  setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>;
  
  jobs: JobOpening[];
  activeJobId: string;
  setActiveJobId: (id: string) => void;
  activeJob: JobOpening | undefined;
  addNewJob: (job: Omit<JobOpening, "id" | "createdAt" | "applicantsCount">) => void;

  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
  seedCampusCandidates: (injected?: Candidate[]) => void;
  isAnonymizedScreening: boolean;
  setIsAnonymizedScreening: (val: boolean) => void;
  dispatchGapSprint: (candidateId: string, skillId: string, skillName: string) => Promise<void>;
  completeGapSprint: (candidateId: string, skillId: string, score?: number) => Promise<void>;
  updateCandidatePipelineStatus: (
    candidateId: string,
    newStatus: Candidate["pipelineStatus"],
    actorName: string
  ) => void;

  credentials: ProofOfWorkCredential[];
  mintCredential: (
    credData: Omit<ProofOfWorkCredential, "hash" | "canonicalPayload" | "issuedAt">
  ) => Promise<ProofOfWorkCredential>;
  getCredentialByHash: (hash: string) => ProofOfWorkCredential | undefined;

  // Authentication state
  isAuthenticated: boolean;
  currentUser: {
    name: string;
    email: string;
    role: RoleType;
    avatarUrl?: string;
    orgName?: string;
  } | null;
  login: (role: RoleType, email: string, orgId?: string) => void;
  logout: () => void;
  registerStudent: (studentData: {
    fullName: string;
    email: string;
    college: string;
    gradYear?: number;
    targetRole?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    skills?: string[];
  }) => Candidate;
  updateEmployerProfile: (updates: { name?: string; email?: string; orgName?: string }) => void;
  updateAdminProfile: (updates: { name?: string; email?: string }) => void;

  // Student specific
  currentStudent: Candidate;
  updateStudentProfile: (updates: Partial<Candidate>) => void;
  studentPrivacyHideAttempts: boolean;
  setStudentPrivacyHideAttempts: (val: boolean) => void;

  // Admin & Oversight
  taxonomy: typeof INITIAL_TAXONOMY;
  anomalies: AnomalyLog[];
  resolveAnomaly: (id: string) => void;
  logAnomaly: (anomaly: Omit<AnomalyLog, "id" | "timestamp" | "resolved">) => void;

  // Notifications
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
  addToast: (toast: Omit<ToastNotification, "id" | "timestamp">) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

function getSavedSession() {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("aspireai_auth_session");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function createRegisteredCandidate(studentData: {
  fullName: string;
  email: string;
  college: string;
  gradYear?: number;
  targetRole?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
}): Candidate {
  const id = "cand-" + Date.now();
  const candidateSkills = (studentData.skills || ["Python", "FastAPI", "SQL", "Git"]).map((s, idx) => ({
    skillId: s.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    skillName: s,
    category: "backend" as const,
    level: "Intermediate" as const,
    isVerified: idx === 0,
    credentialHash:
      idx === 0
        ? "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
        : undefined,
    verifiedAt: idx === 0 ? new Date().toISOString().split("T")[0] : undefined,
    score: idx === 0 ? 92 : undefined,
  }));

  const newCandidate: Candidate = {
    id,
    fullName: studentData.fullName,
    anonymizedId: `Candidate #${Math.floor(1000 + Math.random() * 9000)}`,
    email: studentData.email,
    college: studentData.college,
    anonymizedCollege:
      studentData.college.includes("IIT") ||
      studentData.college.includes("NIT") ||
      studentData.college.includes("BITS")
        ? "Tier-1 Technical Institute"
        : "Accredited Engineering University",
    gradYear: studentData.gradYear || 2026,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(studentData.fullName)}`,
    targetRole: studentData.targetRole || "Software Engineer",
    currentTier: "bridgeable",
    readinessScore: 78,
    skills: candidateSkills,
    missingCompetencies: ["PostgreSQL Optimization", "System Architecture"],
    githubUrl: studentData.githubUrl || `https://github.com/${studentData.fullName.toLowerCase().replace(/\s+/g, "")}`,
    linkedinUrl: studentData.linkedinUrl || `https://linkedin.com/in/${studentData.fullName.toLowerCase().replace(/\s+/g, "")}`,
    experienceYears: 1,
    projects: [
      {
        title: "Distributed Microservices Engine",
        description: "High-throughput asynchronous event processing backend built with FastAPI, Redis, and PostgreSQL.",
        tech: ["Python", "FastAPI", "Docker", "PostgreSQL"],
        link: studentData.githubUrl,
      },
    ],
    pipelineStatus: "applied",
    statusHistory: [
      {
        status: "applied",
        timestamp: new Date().toLocaleDateString(),
        updatedBy: "System Registration",
      },
    ],
    credentials: [],
  };

  return newCandidate;
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<RoleType>(() => {
    return getSavedSession()?.role || "employer";
  });
  const [organizations, setOrganizations] = useState<Organization[]>(INITIAL_ORGS);
  const [currentOrg, setCurrentOrg] = useState<Organization>(INITIAL_ORGS[0]);
  const [jobs, setJobs] = useState<JobOpening[]>(INITIAL_JOBS);
  const [activeJobId, setActiveJobId] = useState<string>(INITIAL_JOBS[0].id);
  const [candidates, setCandidates] = useState<Candidate[]>(CAMPUS_25_CANDIDATES);
  const [credentials, setCredentials] = useState<ProofOfWorkCredential[]>(INITIAL_CREDENTIALS);
  const [isAnonymizedScreening, setIsAnonymizedScreening] = useState<boolean>(false);
  const [studentPrivacyHideAttempts, setStudentPrivacyHideAttempts] = useState<boolean>(true);
  const [taxonomy] = useState(INITIAL_TAXONOMY);
  const [anomalies, setAnomalies] = useState<AnomalyLog[]>(INITIAL_ANOMALIES);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // The logged-in student persona defaults to cand-1 ("Aditya Verma", Bridgeable at 78%)
  const [currentStudentId, setCurrentStudentId] = useState<string>(() => {
    return getSavedSession()?.currentStudentId || "cand-1";
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = getSavedSession();
    return session?.isAuthenticated !== undefined ? session.isAuthenticated : true;
  });
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: RoleType;
    avatarUrl?: string;
    orgName?: string;
  } | null>(() => {
    const session = getSavedSession();
    if (session?.currentUser) return session.currentUser;
    return {
      name: "Priya Sharma",
      email: "priya.sharma@acme.com",
      role: "employer",
      orgName: "Acme HyperScale Systems",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    };
  });

  const persistSession = (
    savedRole: RoleType,
    userObj: {
      name: string;
      email: string;
      role: RoleType;
      avatarUrl?: string;
      orgName?: string;
    },
    sId?: string
  ) => {
    try {
      localStorage.setItem(
        "aspireai_auth_session",
        JSON.stringify({
          role: savedRole,
          currentUser: userObj,
          isAuthenticated: true,
          currentStudentId: sId || currentStudentId,
        })
      );
    } catch (e) {
      console.warn("Failed to persist session", e);
    }
  };

  const login = (newRole: RoleType, email: string, orgId?: string) => {
    setRole(newRole);
    setIsAuthenticated(true);

    if (newRole === "employer") {
      const selectedOrg = organizations.find((o) => o.id === orgId) || organizations[0];
      setCurrentOrg(selectedOrg);
      const userObj = {
        name: "Priya Sharma",
        email: email || "priya.sharma@acme.com",
        role: "employer" as RoleType,
        orgName: selectedOrg.name,
        avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      };
      setCurrentUser(userObj);
      persistSession("employer", userObj);
      addToast({
        type: "success",
        title: "Authenticated as Employer / Recruiter",
        message: `Signed in to ${selectedOrg.name}. Talent Radar and screening pipelines loaded.`,
      });
    } else if (newRole === "student") {
      const targetStudent = candidates.find((c) => c.email === email) || currentStudent;
      setCurrentStudentId(targetStudent.id);
      const userObj = {
        name: targetStudent.fullName,
        email: email || targetStudent.email,
        role: "student" as RoleType,
        avatarUrl: targetStudent.avatarUrl,
      };
      setCurrentUser(userObj);
      persistSession("student", userObj, targetStudent.id);
      addToast({
        type: "success",
        title: "Authenticated as Student / Candidate",
        message: `Welcome back, ${targetStudent.fullName}. Target role delta benchmarks ready.`,
      });
    } else if (newRole === "admin") {
      const userObj = {
        name: "Platform Superuser",
        email: email || "root@aspire.ai",
        role: "admin" as RoleType,
      };
      setCurrentUser(userObj);
      persistSession("admin", userObj);
      addToast({
        type: "success",
        title: "Superuser Session Initialized (Root)",
        message: "Full administrative oversight, cryptographic ledger audit, and multi-tenant controls active.",
      });
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    clearAuthToken();
    try {
      localStorage.removeItem("aspireai_auth_session");
    } catch {}
    addToast({
      type: "info",
      title: "Session Terminated",
      message: "You have securely logged out of Aspire AI.",
    });
  };

  const registerStudent = (studentData: {
    fullName: string;
    email: string;
    college: string;
    gradYear?: number;
    targetRole?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    skills?: string[];
  }): Candidate => {
    const newCandidate = createRegisteredCandidate(studentData);
    const id = newCandidate.id;

    setCandidates((prev) => [newCandidate, ...prev]);
    setCurrentStudentId(id);
    setRole("student");
    setIsAuthenticated(true);
    const userObj = {
      name: newCandidate.fullName,
      email: newCandidate.email,
      role: "student" as RoleType,
      avatarUrl: newCandidate.avatarUrl,
    };
    setCurrentUser(userObj);
    persistSession("student", userObj, id);

    addToast({
      type: "success",
      title: `Welcome, ${newCandidate.fullName}! 🎉`,
      message: `Your student profile has been created and registered on Aspire AI.`,
    });

    return newCandidate;
  };

  const updateEmployerProfile = (updates: { name?: string; email?: string; orgName?: string }) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updates } : prev));
    if (updates.orgName) {
      setCurrentOrg((prev) => ({ ...prev, name: updates.orgName! }));
    }
    addToast({
      type: "success",
      title: "Employer Profile Saved",
      message: "Recruiter organization details updated successfully.",
    });
  };

  const updateAdminProfile = (updates: { name?: string; email?: string }) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updates } : prev));
    addToast({
      type: "success",
      title: "Admin Profile Updated",
      message: "Platform superuser profile successfully saved.",
    });
  };

  const activeJob = jobs.find((j) => j.id === activeJobId) || jobs[0];
  const currentStudent = candidates.find((c) => c.id === currentStudentId) || candidates[0];

  const addToast = (toast: Omit<ToastNotification, "id" | "timestamp">) => {
    const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const newToast: ToastNotification = {
      ...toast,
      id,
      timestamp: new Date().toLocaleTimeString(),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    // Auto-disappear after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addNewJob = (jobData: Omit<JobOpening, "id" | "createdAt" | "applicantsCount">) => {
    const newJob: JobOpening = {
      ...jobData,
      id: "job-" + Date.now(),
      createdAt: new Date().toISOString().split("T")[0],
      applicantsCount: 0,
    };
    setJobs((prev) => [newJob, ...prev]);
    setActiveJobId(newJob.id);
    addToast({
      type: "success",
      title: "Job Ingested Successfully",
      message: `"${newJob.title}" parsed with ${newJob.criticalSkills.length} critical skills and ${newJob.optionalSkills.length} optional skills.`,
    });
  };

  const seedCampusCandidates = (injected?: Candidate[]) => {
    const list = injected && injected.length > 0 ? injected : CAMPUS_25_CANDIDATES;
    setCandidates(list);
    addToast({
      type: "success",
      title: "25+ Campus Candidates Injected 🚀",
      message: `Populated ${list.length} multi-tier engineering candidates across IIT, NIT, BITS, VIT, and Tier-3 colleges.`,
    });
  };

  const dispatchGapSprint = async (candidateId: string, skillId: string, skillName: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;

    // Call FastAPI Sprint Dispatch API (E6)
    try {
      await fetch("http://localhost:8000/api/v1/sprints/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidateId,
          candidate_name: cand.fullName,
          candidate_email: cand.email,
          skill_id: skillId,
          skill_name: skillName,
          org_id: currentOrg.id,
          job_id: activeJobId,
        }),
      });
    } catch (err) {
      console.warn("Backend offline, dispatching via local state (NF2):", err);
    }

    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        return {
          ...c,
          sprintAssigned: {
            skillId,
            skillName,
            dispatchedAt: new Date().toLocaleString(),
            status: "pending",
          },
        };
      })
    );

    addToast({
      type: "info",
      title: "1-Click Gap Sprint Dispatched (E6)",
      message: `Sent targeted 10-min challenge for "${skillName}" to ${
        isAnonymizedScreening ? cand.anonymizedId : cand.fullName
      }. Real-time score elevation triggers when passed (E9).`,
    });
  };

  const completeGapSprint = async (
    candidateId: string,
    skillId: string,
    customScore?: number
  ) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;

    const skillName =
      cand.sprintAssigned?.skillName ||
      cand.missingCompetencies[0] ||
      "Target Competency";
    const score = customScore || 92;

    let hash = "";
    let boostedScore = 92;
    let newTier: ReadinessTier = "job_ready";

    // Call FastAPI Sprint Complete API (E9)
    try {
      const res = await fetch("http://localhost:8000/api/v1/sprints/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidateId,
          candidate_name: cand.fullName,
          candidate_email: cand.email,
          skill_id: skillId,
          skill_name: skillName,
          score: score,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        hash = data.credential_hash;
        boostedScore = data.boosted_score;
        newTier = data.new_tier as ReadinessTier;
      }
    } catch (err) {
      console.warn("Backend offline, calculating liquidity locally (NF2):", err);
    }

    const issuedAt = new Date().toISOString();
    const canonicalPayload = canonicalizeJSON({
      candidateEmail: cand.email,
      candidateId: cand.id,
      issuedAt,
      passedQuestions: 3,
      score,
      skillId,
      totalQuestions: 3,
    });

    if (!hash) {
      hash = await computeSHA256(canonicalPayload);
    }

    const newCred: ProofOfWorkCredential = {
      hash,
      candidateId: cand.id,
      candidateName: cand.fullName,
      candidateEmail: cand.email,
      skillId,
      skillName,
      score,
      passedQuestions: 3,
      totalQuestions: 3,
      issuedAt,
      issuerOrg: "Aspire AI Trust Engine",
      isSponsored: false,
      canonicalPayload: canonicalPayload,
      answersLog: [
        {
          questionId: "q-1",
          question: `Production verification challenge on ${skillName}`,
          selectedOption: "Selected verified industrial answer.",
          isCorrect: true,
          timeSpentSeconds: 45,
        },
      ],
      antiCheatAudit: {
        tabBlurEvents: 0,
        flagged: false,
      },
    };

    setCredentials((prev) => [newCred, ...prev]);

    // Real-Time Pipeline Liquidity Update (E9)
    setCandidates((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== candidateId) return c;

        const updatedSkills = c.skills.map((s) => {
          if (s.skillId === skillId) {
            return {
              ...s,
              isVerified: true,
              credentialHash: hash,
              verifiedAt: issuedAt.split("T")[0],
              score,
            };
          }
          return s;
        });

        const exists = updatedSkills.some((s) => s.skillId === skillId);
        if (!exists) {
          updatedSkills.push({
            skillId,
            skillName,
            category: "backend",
            level: "Advanced",
            isVerified: true,
            credentialHash: hash,
            verifiedAt: issuedAt.split("T")[0],
            score,
          });
        }

        const updatedMissing = c.missingCompetencies.filter(
          (m) => m.toLowerCase() !== skillName.toLowerCase()
        );

        return {
          ...c,
          skills: updatedSkills,
          missingCompetencies: updatedMissing,
          readinessScore: boostedScore,
          currentTier: newTier,
          credentials: [newCred, ...c.credentials],
          sprintAssigned: {
            skillId,
            skillName,
            dispatchedAt: c.sprintAssigned?.dispatchedAt || new Date().toLocaleString(),
            status: "passed" as const,
          },
        };
      });

      // Automatically re-sort candidates so elevated candidate floats to top (E3, E9)
      return [...updated].sort((a, b) => b.readinessScore - a.readinessScore);
    });

    addToast({
      type: "credential",
      title: "Real-Time Talent Liquidity (E9) ⚡",
      message: `${
        isAnonymizedScreening ? cand.anonymizedId : cand.fullName
      } passed "${skillName}" sprint! Readiness boosted to ${boostedScore}% (${newTier.toUpperCase()}). Elevated on recruiter Talent Radar!`,
    });
  };

  const updateCandidatePipelineStatus = (
    candidateId: string,
    newStatus: Candidate["pipelineStatus"],
    actorName: string
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        const newHistory = [
          ...c.statusHistory,
          {
            status: newStatus,
            timestamp: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
            updatedBy: actorName,
          },
        ];
        return {
          ...c,
          pipelineStatus: newStatus,
          statusHistory: newHistory,
        };
      })
    );

    const cand = candidates.find((c) => c.id === candidateId);
    addToast({
      type: "success",
      title: "Pipeline Status Updated",
      message: `${isAnonymizedScreening ? cand?.anonymizedId : cand?.fullName} moved to "${newStatus.toUpperCase()}".`,
    });
  };

  const updateStudentProfile = (updates: Partial<Candidate>) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === currentStudent.id ? { ...c, ...updates } : c))
    );
  };

  const mintCredential = async (
    credData: Omit<ProofOfWorkCredential, "hash" | "canonicalPayload" | "issuedAt">
  ): Promise<ProofOfWorkCredential> => {
    const issuedAt = new Date().toISOString();
    
    // Canonical payload matching deterministic keys
    const canonicalObj = {
      candidateEmail: credData.candidateEmail,
      candidateId: credData.candidateId,
      issuedAt,
      passedQuestions: credData.passedQuestions,
      score: credData.score,
      skillId: credData.skillId,
      totalQuestions: credData.totalQuestions,
    };

    const canonicalPayload = canonicalizeJSON(canonicalObj);
    const hash = await computeSHA256(canonicalPayload);

    const newCred: ProofOfWorkCredential = {
      ...credData,
      hash,
      canonicalPayload,
      issuedAt,
    };

    setCredentials((prev) => [newCred, ...prev]);

    // Notify backend sprint registry (E9)
    try {
      fetch("http://localhost:8000/api/v1/sprints/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: credData.candidateId,
          candidate_name: credData.candidateName,
          candidate_email: credData.candidateEmail,
          skill_id: credData.skillId,
          skill_name: credData.skillName,
          score: credData.score,
        }),
      }).catch((e) => console.warn("Backend sprint sync offline:", e));
    } catch {}

    // Automatically boost candidate profile (S12, E9)
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== credData.candidateId) return c;

        // Mark skill as verified
        const updatedSkills = c.skills.map((s) => {
          if (s.skillId === credData.skillId) {
            return {
              ...s,
              isVerified: true,
              credentialHash: hash,
              verifiedAt: issuedAt.split("T")[0],
              score: credData.score,
            };
          }
          return s;
        });

        // If skill wasn't in list, add it
        const exists = updatedSkills.some((s) => s.skillId === credData.skillId);
        if (!exists) {
          updatedSkills.push({
            skillId: credData.skillId,
            skillName: credData.skillName,
            category: "backend",
            level: "Advanced",
            isVerified: true,
            credentialHash: hash,
            verifiedAt: issuedAt.split("T")[0],
            score: credData.score,
          });
        }

        // Remove from missing competencies
        const updatedMissing = c.missingCompetencies.filter(
          (m) => m.toLowerCase() !== credData.skillName.toLowerCase()
        );

        // Recompute readiness score (Weighted Deficit Resistance Model)
        // With missing competency closed, score boosts to >= 85% Job-Ready!
        const boostedScore = Math.min(100, Math.max(88, c.readinessScore + 14));
        const newTier: ReadinessTier = boostedScore >= 85 ? "job_ready" : "bridgeable";

        return {
          ...c,
          skills: updatedSkills,
          missingCompetencies: updatedMissing,
          readinessScore: boostedScore,
          currentTier: newTier,
          credentials: [newCred, ...c.credentials],
          sprintAssigned: c.sprintAssigned
            ? { ...c.sprintAssigned, status: "passed" }
            : undefined,
        };
      })
    );

    addToast({
      type: "credential",
      title: "Cryptographic Credential Minted! 🛡️",
      message: `SHA-256 seal issued for ${credData.skillName}. Score: ${credData.score}%. Verification hash: ${hash.substring(0, 16)}...`,
    });

    return newCred;
  };

  const getCredentialByHash = (hash: string) => {
    return credentials.find((c) => c.hash.toLowerCase() === hash.toLowerCase());
  };

  const logAnomaly = (anomaly: Omit<AnomalyLog, "id" | "timestamp" | "resolved">) => {
    const newAnomaly: AnomalyLog = {
      ...anomaly,
      id: "anom-" + Date.now(),
      timestamp: new Date().toLocaleString(),
      resolved: false,
    };
    setAnomalies((prev) => [newAnomaly, ...prev]);
    addToast({
      type: "warning",
      title: `Anomaly Detected: ${anomaly.type}`,
      message: anomaly.description,
    });
  };

  const resolveAnomaly = (id: string) => {
    setAnomalies((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a))
    );
  };

  return (
    <StoreContext.Provider
      value={{
        role,
        setRole,
        currentOrg,
        setCurrentOrg,
        organizations,
        setOrganizations,
        jobs,
        activeJobId,
        setActiveJobId,
        activeJob,
        addNewJob,
        candidates,
        setCandidates,
        seedCampusCandidates,
        isAnonymizedScreening,
        setIsAnonymizedScreening,
        dispatchGapSprint,
        completeGapSprint,
        updateCandidatePipelineStatus,
        credentials,
        mintCredential,
        getCredentialByHash,
        isAuthenticated,
        currentUser,
        login,
        logout,
        registerStudent,
        updateEmployerProfile,
        updateAdminProfile,
        currentStudent,
        updateStudentProfile,
        studentPrivacyHideAttempts,
        setStudentPrivacyHideAttempts,
        taxonomy,
        anomalies,
        resolveAnomaly,
        logAnomaly,
        toasts,
        dismissToast,
        addToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
