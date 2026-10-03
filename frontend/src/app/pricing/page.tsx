"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Calculator,
  Presentation,
  Check,
  Copy,
  Users,
  FileCheck,
  ShieldAlert,
  Crown,
  CreditCard,
  Lock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  billingApi,
  UserSubscription,
  CheckoutResponse,
} from "@/lib/api/client";

interface SelectedPlanModalData {
  planId: string;
  name: string;
  priceInr: number;
  priceUsd: number;
  priceFormatted: string;
  target: "student" | "employer";
  features: string[];
}

export default function PricingRevenuePage() {
  const { role, currentOrg, setCurrentOrg, addToast } = useStore();

  // Active audience tab: 'students' | 'employers' | 'all'
  const [activeSegment, setActiveSegment] = useState<"all" | "students" | "employers">(
    role === "employer" ? "employers" : "all"
  );

  // Billing frequency: 'monthly' | 'annual' (20% discount)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  // Presentation / PPT Slide Mode
  const [isSlideMode, setIsSlideMode] = useState(false);

  // Interactive ROI Calculator State
  const [roiType, setRoiType] = useState<"student" | "employer">("employer");
  const [hiresPerMonth, setHiresPerMonth] = useState(4);
  const [prepMonths, setPrepMonths] = useState(3);

  // Live Subscription Telemetry & Gateway State
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [isLoadingSub, setIsLoadingSub] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<"razorpay" | "stripe">("razorpay");
  const [checkoutSession, setCheckoutSession] = useState<CheckoutResponse | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"configure" | "ready" | "success">("configure");
  const [selectedPlanModal, setSelectedPlanModal] = useState<SelectedPlanModalData | null>(null);

  useEffect(() => {
    async function loadCurrentSubscription() {
      setIsLoadingSub(true);
      try {
        const sub = await billingApi.getCurrentSubscription();
        setCurrentSubscription(sub);
      } catch (err) {
        console.warn("Could not load current subscription:", err);
      } finally {
        setIsLoadingSub(false);
      }
    }
    loadCurrentSubscription();
  }, []);

  const handleInitiateCheckout = async () => {
    if (!selectedPlanModal) return;
    setIsProcessingCheckout(true);
    try {
      const session = await billingApi.createCheckout({
        plan_id: selectedPlanModal.planId,
        billing_cycle: billingCycle,
        provider: paymentProvider,
        currency: paymentProvider === "razorpay" ? "INR" : "USD",
      });
      setCheckoutSession(session);
      setCheckoutStep("ready");
    } catch (err: any) {
      addToast({
        type: "warning",
        title: "Checkout Initialization Failed",
        message: err.message || "Could not connect to payment gateway",
      });
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlanModal || !checkoutSession) return;
    setIsProcessingCheckout(true);
    try {
      const mockPayId =
        paymentProvider === "razorpay"
          ? `pay_${Date.now().toString().slice(-8)}`
          : `pi_${Date.now().toString().slice(-8)}`;
      const mockSig = `sig_${Math.random().toString(36).substring(2, 14)}`;

      const res = await billingApi.verifyPayment({
        provider: paymentProvider,
        plan_id: selectedPlanModal.planId,
        billing_cycle: billingCycle,
        order_id: checkoutSession.order_id,
        payment_id: mockPayId,
        signature: mockSig,
        session_id: checkoutSession.session_id,
      });

      setCurrentSubscription(res.subscription);
      if (currentOrg && selectedPlanModal.target === "employer") {
        const planTier =
          selectedPlanModal.planId === "enterprise"
            ? "Enterprise"
            : selectedPlanModal.planId === "growth"
            ? "Growth"
            : "Starter";
        setCurrentOrg({
          ...currentOrg,
          plan: planTier,
        });
      }

      addToast({
        type: "success",
        title: "Subscription Activated! 🚀",
        message: `Plan ${selectedPlanModal.name} (${billingCycle}) is active. Live quotas provisioned!`,
      });
      setCheckoutStep("success");
    } catch (err: any) {
      addToast({
        type: "warning",
        title: "Payment Verification Failed",
        message: err.message || "Failed to confirm payment signature",
      });
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your active subscription? You will retain access until the end of your billing cycle."
      )
    )
      return;
    try {
      const res = await billingApi.cancelSubscription();
      if (currentSubscription) {
        setCurrentSubscription({ ...currentSubscription, status: "cancelled" });
      }
      addToast({
        type: "info",
        title: "Subscription Cancelled",
        message: res.message || "Your subscription has been scheduled for cancellation.",
      });
    } catch (err: any) {
      addToast({
        type: "warning",
        title: "Cancellation Error",
        message: err.message || "Could not cancel subscription",
      });
    }
  };

  const [copiedSlide, setCopiedSlide] = useState(false);

  const copySlideToClipboard = () => {
    const slideText = `### Monetization & Revenue Model

🎓 1. Job Seekers & Students (Upskilling)
• Free Tier (₹0): Resume upload, Skill Gap Delta Radar, micro-sprints, and free bug-fix sandbox challenges.
• Pro Upskilling (₹299/mo): AI mock interviews, deep GitHub code analysis, and personalized 90-day career roadmaps.

💼 2. Employers & Recruiters (B2B SaaS)
• Starter / Bootstrapped Startup (₹4,999/mo): 25 evaluations/mo, Talent Radar, & 3-tier candidate segmentation (Job-Ready, Bridgeable, Mismatch).
• Growth / Scale-Up (₹14,999/mo): 150 evaluations/mo, 1-Click Gap Sprints, Blind Screening toggles, & Kanban collaboration pipelines.
• Enterprise / Corporate (₹49,999/mo): Unlimited evaluations, custom bug repositories, ATS webhooks, and secure shareable shortlists (/verify/[hash]).

Value Prop: Empowerment over automation—we filter out resume spam and cheating, presenting hiring managers with the best verified choices while keeping human intervention at the center.`;

    navigator.clipboard.writeText(slideText);
    setCopiedSlide(true);
    setTimeout(() => setCopiedSlide(false), 2500);
  };

  // Employer ROI calculations
  const agencyCostPerHire = 120000; // Average ₹1.2L recruitment agency fee in India
  const traditionalTotalCost = hiresPerMonth * agencyCostPerHire;
  const aspireaiCost = hiresPerMonth <= 2 ? 4999 : hiresPerMonth <= 10 ? 14999 : 49999;
  const employerSavings = traditionalTotalCost - aspireaiCost;
  const employerSavingsPercent = Math.round((employerSavings / traditionalTotalCost) * 100);

  // Student ROI calculations
  const proCostTotal = 299 * prepMonths;
  const tier3StartingCTC = 650000; // ₹6.5 LPA
  const tier1StartingCTC = 1400000; // ₹14.0 LPA
  const studentCTCLift = tier1StartingCTC - tier3StartingCTC;
  const studentROI = Math.round(studentCTCLift / proCostTotal);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      {/* Background Accent Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-1/4 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* ========================================================= */}
        {/* LIVE SUBSCRIPTION TELEMETRY & QUOTA METRIC BANNER         */}
        {/* ========================================================= */}
        {currentSubscription && currentSubscription.status === "active" && (
          <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-slate-900/60 backdrop-blur-md p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                <Crown className="w-5 h-5 text-amber-300" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    Current Plan: {currentSubscription.plan_id.replace("_", " ")}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active Subscription
                  </span>
                  <span className="text-xs text-slate-400">
                    Billed {currentSubscription.billing_cycle} via {currentSubscription.provider.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-4 flex-wrap">
                  <span>
                    Concurrent Active Jobs:{" "}
                    <strong className="text-slate-200">
                      {currentSubscription.active_jobs_limit === -1 ? "Unlimited" : currentSubscription.active_jobs_limit}
                    </strong>
                  </span>
                  <span>
                    Monthly Evaluations:{" "}
                    <strong className="text-slate-200">
                      {currentSubscription.evaluations_used} /{" "}
                      {currentSubscription.evaluations_limit === -1 ? "Unlimited" : currentSubscription.evaluations_limit}
                    </strong>
                  </span>
                  <span>
                    Seats Provisioned:{" "}
                    <strong className="text-slate-200">{currentSubscription.seats_purchased}</strong>
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCancelSubscription}
              className="text-xs px-3.5 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors whitespace-nowrap"
            >
              Cancel Auto-Renewal
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* HEADER CONTROLS: Segment, Billing & PPT Slide Mode Toggle  */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800/80 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Transparent & Proof-Driven Monetization</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Monetization & <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">Revenue Model</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl">
              Scalable freemium upskilling for engineers combined with high-margin B2B SaaS for technical recruiters and hiring managers.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Slide Presentation Mode Button */}
            <button
              onClick={() => setIsSlideMode(!isSlideMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isSlideMode
                  ? "bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/30"
                  : "bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30"
              }`}
            >
              <Presentation className="w-4 h-4" />
              <span>{isSlideMode ? "Exit Slide Mode" : "📺 PPT Slide Mode"}</span>
            </button>

            {/* Copy Slide Notes Button */}
            <button
              onClick={copySlideToClipboard}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
              title="Copy Slide Markdown to Clipboard"
            >
              {copiedSlide ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied Slide!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Slide Content</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* OPTIONAL: PPT PRESENTATION SLIDE MODE                      */}
        {/* ========================================================= */}
        {isSlideMode && (
          <div className="relative rounded-3xl border-2 border-amber-500/50 bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Slide Badge */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
                  Investor & Demo Slide
                </span>
                <span className="text-xs text-slate-400">Slide Title: Monetization & Revenue Model</span>
              </div>
              <span className="text-xs font-mono text-slate-500">Aspire AI · 16:9 Presentation View</span>
            </div>

            {/* Slide 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Column 1: Job Seekers & Students */}
              <div className="rounded-2xl bg-slate-950/70 border border-emerald-500/30 p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>1. Job Seekers & Students</span>
                    </h3>
                    <span className="text-xs font-medium text-emerald-400">B2C Upskilling & Placement Acceleration</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Free Tier */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">Free Tier</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        ₹0
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Resume upload, Skill Gap Delta Radar, micro-sprints, and free bug-fix sandbox challenges.
                    </p>
                  </div>

                  {/* Pro Upskilling */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-purple-950/30 to-slate-900 border border-purple-500/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Pro Upskilling</span>
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                        ₹299 / mo
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      AI mock interviews, deep GitHub code analysis, and personalized 90-day career roadmaps.
                    </p>
                  </div>
                </div>
              </div>

              {/* Column 2: Employers & Recruiters */}
              <div className="rounded-2xl bg-slate-950/70 border border-blue-500/30 p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>2. Employers & Recruiters</span>
                    </h3>
                    <span className="text-xs font-medium text-blue-400">B2B SaaS Verified ATS Platform</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Starter */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">Starter / Bootstrapped Startup</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                        ₹4,999 / mo
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      25 evaluations/mo, Talent Radar, & 3-tier candidate segmentation (Job-Ready, Bridgeable, Mismatch).
                    </p>
                  </div>

                  {/* Growth */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>Growth / Scale-Up</span>
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        ₹14,999 / mo
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      150 evaluations/mo, 1-Click Gap Sprints, Blind Screening toggles, & Kanban collaboration pipelines.
                    </p>
                  </div>

                  {/* Enterprise */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">Enterprise / Corporate</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                        ₹49,999 / mo
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Unlimited evaluations, custom bug repositories, ATS webhooks, and secure shareable shortlists (<code className="text-purple-300">/verify/[hash]</code>).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide Value Proposition Callout */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-blue-950/50 border border-purple-500/30 text-center">
              <p className="text-sm sm:text-base font-semibold text-slate-200 italic">
                &ldquo;Value Prop: Empowerment over automation—we filter out resume spam and cheating, presenting hiring managers with the best verified choices while keeping human intervention at the center.&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* INTERACTIVE CONTROLS: Segment Filter & Billing Switcher   */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
          {/* Segment Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveSegment("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSegment === "all"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Plans
            </button>
            <button
              onClick={() => setActiveSegment("students")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSegment === "students"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>For Job Seekers & Students</span>
            </button>
            <button
              onClick={() => setActiveSegment("employers")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSegment === "employers"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>For Employers & B2B</span>
            </button>
          </div>

          {/* Billing Switcher */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className={billingCycle === "monthly" ? "text-white font-bold" : "text-slate-400"}>
              Monthly Billing
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-800 transition-colors focus:outline-none"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-purple-500 transition-transform ${
                  billingCycle === "annual" ? "translate-x-6 bg-emerald-400" : "translate-x-1"
                }`}
              />
            </button>
            <span className={billingCycle === "annual" ? "text-emerald-400 font-bold" : "text-slate-400"}>
              Annual (Save 20%)
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1: JOB SEEKERS & STUDENTS (B2C UPSKILLING)        */}
        {/* ========================================================= */}
        {(activeSegment === "all" || activeSegment === "students") && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">1. Job Seekers & Students (Upskilling)</h2>
                <p className="text-xs text-slate-400">
                  Prove your skills with real code, eliminate rejection fatigue, and unlock high-paying Tier-1 engineering jobs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Free Tier (₹0) */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg hover:shadow-slate-900/50">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Free Tier</span>
                      <h3 className="text-2xl font-bold text-white mt-1">Foundation Sandbox</h3>
                    </div>
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono">₹0</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    Essential diagnostics to audit your resume and discover exact tech gaps before applying.
                  </p>

                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">What&apos;s Included:</p>
                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Resume Upload:</strong> Instant ATS parsing (PDF/DOCX) with extracted skill ontology</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Skill Gap Delta Radar:</strong> Visual comparison against 60 live engineering job descriptions</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Micro-Sprints:</strong> 3-day targeted practice modules for critical framework gaps</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Free Bug-Fix Sandbox Challenges:</strong> Interactive code debugger with automated tests</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Cryptographic Certificate:</strong> Shareable SHA-256 public verification badge</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                  <Link
                    href="/student"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Start Free Upskilling</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Pro Upskilling (₹299/mo) */}
              <div className="relative rounded-2xl bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 border-2 border-purple-500/50 p-6 flex flex-col justify-between shadow-xl shadow-purple-950/20">
                {/* Popular Pill */}
                <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Most Popular for Campus Placements</span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Pro Upskilling</span>
                      <h3 className="text-2xl font-bold text-white mt-1">Tier-1 Role Acceleration</h3>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-white font-mono">
                          {billingCycle === "annual" ? "₹239" : "₹299"}
                        </span>
                        <span className="text-xs text-slate-400">/ mo</span>
                      </div>
                      {billingCycle === "annual" && (
                        <span className="text-[10px] text-emerald-400 font-semibold">Billed ₹2,868 / year</span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-300">
                    Comprehensive AI grill coaching, deep repo security audits, and personalized 90-day execution roadmaps.
                  </p>

                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Everything in Free, plus:</p>
                    <ul className="space-y-2.5 text-xs text-slate-200">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>AI Mock Interviews:</strong> Real-time technical grill questions with trap follow-ups & model answers</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Deep GitHub Code Analysis:</strong> AST AST parser detecting secrets, .gitignore holes, & production readiness</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Personalized 90-Day Career Roadmaps:</strong> Phased weekly milestones targeting +28% starting CTC lift</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Capstone Blueprints:</strong> Architectural designs for high-concurrency systems (Raft, Saga, Kafka)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Priority Talent Radar Indexing:</strong> Direct visibility to hiring managers on employer pipelines</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-purple-500/20">
                  <button
                    onClick={() => {
                      setSelectedPlanModal({
                        planId: "student_pro",
                        name: "Pro Upskilling",
                        priceInr: billingCycle === "annual" ? 2870 : 299,
                        priceUsd: billingCycle === "annual" ? 47.9 : 4.99,
                        priceFormatted:
                          billingCycle === "annual" ? "₹239/mo (₹2,868/yr)" : "₹299/mo",
                        target: "student",
                        features: [
                          "AI Mock Technical Interviews & Follow-up Traps",
                          "Deep GitHub AST Code & Secret Audits",
                          "Personalized 90-Day Career Roadmaps",
                          "13 Micro-Academy Courses & Mock Tests",
                          "Priority Recruiter Talent Radar Indexing",
                        ],
                      });
                      setCheckoutStep("configure");
                      setCheckoutSession(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Upgrade to Pro Upskilling</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: EMPLOYERS & RECRUITERS (B2B SAAS)              */}
        {/* ========================================================= */}
        {(activeSegment === "all" || activeSegment === "employers") && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">2. Employers & Recruiters (B2B SaaS)</h2>
                <p className="text-xs text-slate-400">
                  Stop reading embellished resumes. Filter out 90% of unqualified applicants in seconds using verified code proof.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Starter (₹4,999/mo) */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Starter</span>
                      <h3 className="text-xl font-bold text-white mt-1">Bootstrapped Startup</h3>
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-blue-400 font-mono">
                      {billingCycle === "annual" ? "₹3,999" : "₹4,999"}
                    </span>
                    <span className="text-xs text-slate-400">/ mo</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    Perfect for seed-stage startups hiring 1–2 critical engineering roles per month.
                  </p>

                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Plan Highlights:</p>
                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>25 Candidate Evaluations / mo:</strong> Automated parsing and skill gap extraction</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>Talent Radar Access:</strong> Instant candidate pool search by hard verified competencies</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>3-Tier Candidate Segmentation:</strong> Instant buckets for <em>Job-Ready</em>, <em>Bridgeable</em>, and <em>Mismatch</em></span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>Basic Email Sprint Dispatch:</strong> Direct challenge links to candidate inbox</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedPlanModal({
                        planId: "starter",
                        name: "Starter / Bootstrapped Startup",
                        priceInr: billingCycle === "annual" ? 47990 : 4999,
                        priceUsd: billingCycle === "annual" ? 566.0 : 59.0,
                        priceFormatted:
                          billingCycle === "annual" ? "₹3,999/mo (₹47,990/yr)" : "₹4,999/mo",
                        target: "employer",
                        features: [
                          "3 Active Job Requisitions",
                          "25 Candidate Evaluations / month",
                          "Talent Radar Candidate Search",
                          "3-Tier Candidate Segmentation (Job-Ready, Bridgeable, Mismatch)",
                          "2 Recruiter Seats Included",
                          "Standard Support",
                        ],
                      });
                      setCheckoutStep("configure");
                      setCheckoutSession(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Choose Starter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Growth / Scale-Up (₹14,999/mo) */}
              <div className="relative rounded-2xl bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border-2 border-blue-500/50 p-6 flex flex-col justify-between shadow-xl shadow-blue-950/30">
                <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span>Best for Fast-Growing Tech Teams</span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Growth Plan</span>
                      <h3 className="text-xl font-bold text-white mt-1">Growth / Scale-Up</h3>
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white font-mono">
                      {billingCycle === "annual" ? "₹11,999" : "₹14,999"}
                    </span>
                    <span className="text-xs text-slate-400">/ mo</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-300">
                    Designed for fast-growing unicorns and Series A/B engineering organizations.
                  </p>

                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Everything in Starter, plus:</p>
                    <ul className="space-y-2.5 text-xs text-slate-200">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>150 Evaluations / mo:</strong> Full resume parsing & vector semantic matchmaking</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>1-Click Gap Sprints:</strong> Dispatch targeted micro-challenges based on missing skills</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>Blind Screening Toggles:</strong> Mask candidate PII to eliminate bias and audit skills purely on code</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>Kanban Collaboration Pipeline:</strong> Multi-reviewer stage management (Screening, Sprint, Offer)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>Candidate GitHub AST Code Audits:</strong> Scan candidates&apos; actual repositories for vulnerabilities</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-blue-500/20">
                  <button
                    onClick={() => {
                      setSelectedPlanModal({
                        planId: "growth",
                        name: "Growth / Scale-Up",
                        priceInr: billingCycle === "annual" ? 143990 : 14999,
                        priceUsd: billingCycle === "annual" ? 1718.0 : 179.0,
                        priceFormatted:
                          billingCycle === "annual" ? "₹11,999/mo (₹1,43,990/yr)" : "₹14,999/mo",
                        target: "employer",
                        features: [
                          "10 Active Job Requisitions",
                          "150 Evaluations / month",
                          "1-Click Gap Sprints & Automated Dispatch",
                          "Blind / Anonymized Screening Toggles",
                          "Kanban Collaboration Pipelines",
                          "GitHub AST Code & Secret Audits",
                          "10 Recruiter Seats Included",
                        ],
                      });
                      setCheckoutStep("configure");
                      setCheckoutSession(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span>Upgrade to Growth</span>
                  </button>
                </div>
              </div>

              {/* Enterprise / Corporate (₹49,999/mo) */}
              <div className="rounded-2xl bg-slate-900/80 border border-purple-500/30 p-6 flex flex-col justify-between hover:border-purple-500/50 transition-all shadow-lg">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Enterprise</span>
                      <h3 className="text-xl font-bold text-white mt-1">Enterprise / Corporate</h3>
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-purple-400 font-mono">
                      {billingCycle === "annual" ? "₹39,999" : "₹49,999"}
                    </span>
                    <span className="text-xs text-slate-400">/ mo</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    High-volume campus recruitment drives and multinational engineering centers.
                  </p>

                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Enterprise Powerhouse:</p>
                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Unlimited Evaluations:</strong> Scale seamlessly through thousands of applicants</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Custom Bug Repositories:</strong> Embed your team&apos;s proprietary codebase into sandbox tests</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>ATS Webhooks & Bi-Directional Sync:</strong> Native connectors for Greenhouse, Lever, & Workday</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Secure Shareable Shortlists:</strong> Cryptographic public verification URLs (<code className="text-purple-300">/verify/[hash]</code>)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Dedicated Talent Success Engineer:</strong> 99.9% uptime SLA & custom role skill modeling</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedPlanModal({
                        planId: "enterprise",
                        name: "Enterprise / Corporate",
                        priceInr: billingCycle === "annual" ? 479990 : 49999,
                        priceUsd: billingCycle === "annual" ? 5750.0 : 599.0,
                        priceFormatted:
                          billingCycle === "annual" ? "₹39,999/mo (₹4,79,990/yr)" : "₹49,999/mo",
                        target: "employer",
                        features: [
                          "Unlimited Active Job Requisitions",
                          "Unlimited Candidate Evaluations",
                          "Custom Bug Repositories & Challenge Tailoring",
                          "Bi-directional ATS Webhooks (Greenhouse/Lever/Workday)",
                          "Secure Shareable Cryptographic Shortlists",
                          "25+ Recruiter Seats & Role Scoping",
                          "Dedicated Account Executive & Custom SLA",
                        ],
                      });
                      setCheckoutStep("configure");
                      setCheckoutSession(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Upgrade to Enterprise</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CORE VALUE PROPOSITION BANNER                             */}
        {/* ========================================================= */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-900/30 via-slate-900 to-blue-900/30 border border-purple-500/30 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-4xl mx-auto space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Core Architectural Philosophy</span>
            </div>

            <blockquote className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
              &ldquo;Empowerment over automation—we filter out resume spam and cheating, presenting hiring managers with the best verified choices while keeping human intervention at the center.&rdquo;
            </blockquote>

            {/* 3 Pillars Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-left">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Proof Over Pedigree</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Replace superficial keyword stuffing with verified code executions and concrete AST proofs.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Anti-Cheating Sandbox</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Dynamic test assertions, randomized seed parameters, and live AST inspection prevent copy-paste LLM fraud.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Human at the Center</h4>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  AI does the heavy evidence gathering; human interviewers make the empathetic, strategic hiring calls.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* INTERACTIVE ROI CALCULATOR                                */}
        {/* ========================================================= */}
        <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Interactive ROI & Value Calculator</h3>
                <p className="text-xs text-slate-400">See concrete economic returns for both technical talent and recruiting teams</p>
              </div>
            </div>

            {/* Toggle Calculator Target */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setRoiType("employer")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  roiType === "employer" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Employer Hiring ROI
              </button>
              <button
                onClick={() => setRoiType("student")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  roiType === "student" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Student CTC Lift ROI
              </button>
            </div>
          </div>

          {/* Employer ROI View */}
          {roiType === "employer" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    How many software engineers do you hire per month? ({hiresPerMonth} hires)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={hiresPerMonth}
                    onChange={(e) => setHiresPerMonth(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>1 Hire (Startup)</span>
                    <span>10 Hires (Scaleup)</span>
                    <span>20+ Hires (Enterprise)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Traditional Headhunter / Agency Fee (8.33% CTC avg):</span>
                    <span className="font-mono text-slate-200">₹{(traditionalTotalCost).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Aspire AI SaaS Platform Cost:</span>
                    <span className="font-mono text-emerald-400 font-bold">₹{aspireaiCost.toLocaleString("en-IN")}/mo</span>
                  </div>
                </div>
              </div>

              {/* Result Callout */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-emerald-950/30 border border-blue-500/30 text-center space-y-3">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Monthly Recruitment Cost Savings
                </span>
                <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 font-mono">
                  ₹{employerSavings.toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-slate-300">
                  You save <strong className="text-emerald-400">{employerSavingsPercent}%</strong> in sourcing and headhunter commissions while gaining verified code sandbox proofs.
                </p>
                <div className="pt-2">
                  <Link
                    href="/employer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                  >
                    <span>Deploy Talent Pipeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Student ROI View */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    Pro Upskilling Sprint Duration: ({prepMonths} Months)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={prepMonths}
                    onChange={(e) => setPrepMonths(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>1 Month (Crash Sprint)</span>
                    <span>3 Months (Full 90-Day Roadmap)</span>
                    <span>6 Months (Comprehensive)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Aspire AI Pro Investment ({prepMonths} mo × ₹299):</span>
                    <span className="font-mono text-purple-400 font-bold">₹{proCostTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Average Campus Offer vs Tier-1 Product CTC:</span>
                    <span className="font-mono text-slate-200">₹6.5 LPA → ₹14.0 LPA</span>
                  </div>
                </div>
              </div>

              {/* Result Callout */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-emerald-950/30 border border-purple-500/30 text-center space-y-3">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Projected Annual CTC Lift
                </span>
                <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 font-mono">
                  +₹{(studentCTCLift / 100000).toFixed(1)} LPA
                </div>
                <p className="text-xs text-slate-300">
                  A small <strong className="text-purple-300">₹{proCostTotal}</strong> investment unlocks an estimated <strong className="text-emerald-400">{studentROI}x Return on Investment</strong> in your first engineering job offer.
                </p>
                <div className="pt-2">
                  <Link
                    href="/hub"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
                  >
                    <span>Explore 13 Courses & Labs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* COMPREHENSIVE FEATURE COMPARISON MATRIX                   */}
        {/* ========================================================= */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h3 className="text-2xl font-bold text-white">Full Feature Comparison</h3>
            <p className="mt-1 text-xs text-slate-400">
              Granular breakdown of capabilities across all tiers and user roles.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-300 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Platform Capability</th>
                  <th className="p-4 text-center">Student Free</th>
                  <th className="p-4 text-center text-purple-400">Student Pro (₹299)</th>
                  <th className="p-4 text-center">Employer Starter (₹4,999)</th>
                  <th className="p-4 text-center text-blue-400">Employer Growth (₹14,999)</th>
                  <th className="p-4 text-center text-purple-300">Enterprise (₹49,999)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="p-4 font-semibold text-white">Resume Parsing & Skill Extraction</td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center font-mono">25 / mo</td>
                  <td className="p-4 text-center font-mono">150 / mo</td>
                  <td className="p-4 text-center font-mono text-purple-400 font-bold">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Skill Gap Delta Radar (vs 60 JDs)</td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">AI Mock Interview Grill Coach</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">GitHub AST Code & Secret Scan</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Personalized 90-Day Career Roadmap</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Blind Screening Toggles (PII Masking)</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">1-Click Micro-Gap Sprints Dispatch</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">ATS Webhooks & Bi-Directional Sync</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center text-slate-500">—</td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Public Cryptographic Verification URL</td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FREQUENTLY ASKED QUESTIONS                                */}
        {/* ========================================================= */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h3 className="text-2xl font-bold text-white">Frequently Asked Questions</h3>
            <p className="mt-1 text-xs text-slate-400">Everything you need to know about our billing and proof model.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                <span>Can students use the platform completely free?</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Yes! Our Free Tier gives every engineering student access to resume parsing, the 60-JD Skill Gap Delta Radar, diagnostic micro-sprints, and free bug-fix sandbox challenges without any credit card.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <span>How does Aspire AI stop candidates from cheating with AI?</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our dynamic sandbox injects randomized test fixtures, evaluates code AST trees directly, and runs real-time code executions. Candidates must explain architectural decisions during follow-up AI grills.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>Are GST invoices provided for Indian registered businesses?</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Yes. All B2B plans include full GST-compliant tax invoices with 18% input credit support for Indian corporate entities and startups.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Can employers upgrade or downgrade plans anytime?</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Absolutely. Start with our Starter plan (₹4,999/mo) and upgrade to Growth or Enterprise as your campus or lateral hiring drives scale up. Unused candidate evaluations roll over for 30 days.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FOOTER CTA CALLOUT                                        */}
        {/* ========================================================= */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to Replace Resume Spam with Verified Engineering Proof?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Join thousands of ambitious students upskilling to Tier-1 roles, and modern tech leaders hiring with zero bias.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/student"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30"
            >
              <GraduationCap className="w-4 h-4" />
              <span>For Job Seekers (Start Free)</span>
            </Link>
            <Link
              href="/employer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
            >
              <Briefcase className="w-4 h-4" />
              <span>For Employers (Talent Radar)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LIVE SUBSCRIPTION CHECKOUT & PAYMENT MODAL                */}
      {/* ========================================================= */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-purple-500/40 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  Checkout: {selectedPlanModal.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedPlanModal(null);
                  setCheckoutSession(null);
                  setCheckoutStep("configure");
                }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Configure & Select Gateway */}
            {checkoutStep === "configure" && (
              <div className="space-y-4">
                {/* Pricing Summary */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center">
                  <span className="text-xs text-slate-400">Total Investment ({billingCycle})</span>
                  <div className="text-3xl font-extrabold text-white font-mono">
                    {paymentProvider === "razorpay"
                      ? `₹${(billingCycle === "annual" ? selectedPlanModal.priceInr : selectedPlanModal.priceInr).toLocaleString("en-IN")}`
                      : `$${(billingCycle === "annual" ? selectedPlanModal.priceUsd : selectedPlanModal.priceUsd).toFixed(2)}`}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Instant Multi-Tenant Provisioning & Live AST Engine Access
                  </span>
                </div>

                {/* Dual Payment Gateway Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Select Payment Gateway & Currency:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentProvider("razorpay")}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        paymentProvider === "razorpay"
                          ? "border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-900/20"
                          : "border-slate-800 bg-slate-950 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-white">🇮🇳 Razorpay</span>
                        {paymentProvider === "razorpay" && (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        INR (₹) • UPI, NetBanking, Domestic Cards
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentProvider("stripe")}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        paymentProvider === "stripe"
                          ? "border-purple-500 bg-purple-500/10 shadow-md shadow-purple-900/20"
                          : "border-slate-800 bg-slate-950 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-white">🌐 Stripe</span>
                        {paymentProvider === "stripe" && (
                          <Check className="w-3.5 h-3.5 text-purple-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        USD ($) • Global Credit Cards & Invoicing
                      </p>
                    </button>
                  </div>
                </div>

                {/* Plan Capabilities Checklist */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Included Capabilities:
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-300 max-h-32 overflow-y-auto pr-1">
                    {selectedPlanModal.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cryptographic Security Assurance */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Secured by 256-bit TLS encryption with HMAC-SHA256 signature verification. No card details stored on local servers.
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setSelectedPlanModal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInitiateCheckout}
                    disabled={isProcessingCheckout}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center justify-center gap-2"
                  >
                    {isProcessingCheckout ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Connecting Gateway...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Initialize Order</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Authorization & Verification */}
            {checkoutStep === "ready" && checkoutSession && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Gateway Order Generated</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                      {paymentProvider.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm font-mono text-purple-300 break-all bg-slate-900 p-2 rounded-lg border border-slate-800">
                    Order ID: {checkoutSession.order_id || checkoutSession.session_id}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                    <span>Amount Payable:</span>
                    <strong className="text-white font-mono">
                      {checkoutSession.currency === "INR" ? "₹" : "$"}
                      {checkoutSession.amount.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Gateway session initialized with live HMAC cryptographic verification. Confirming will activate your subscription and commit live quota updates to the database.
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setCheckoutStep("configure")}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessingCheckout}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2"
                  >
                    {isProcessingCheckout ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Signature...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Confirm & Authorize Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success Confirmation */}
            {checkoutStep === "success" && (
              <div className="space-y-4 py-2 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Payment Verified & Activated!</h4>
                  <p className="text-xs text-slate-400">
                    Your {selectedPlanModal.name} subscription is now active with refreshed quotas and live AST evaluation access.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlanModal(null);
                    setCheckoutSession(null);
                    setCheckoutStep("configure");
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-md shadow-purple-600/30"
                >
                  Done & Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
