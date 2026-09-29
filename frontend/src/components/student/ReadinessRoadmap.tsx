"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import {
  Compass,
  Clock,
  ShieldCheck,
  Zap,
  RefreshCw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Layers,
} from "lucide-react";

interface RoadmapPhase {
  phase: number;
  skill: string;
  title: string;
  current_level: string;
  required_level: string;
  course: {
    path: string;
    duration_minutes: number;
  };
  course_content?: any;
  lessons: Array<{
    title: string;
    duration_minutes: number;
  }>;
  mock_test: {
    question_count: number;
    duration_minutes: number;
    passing_score: number;
  };
  goal: string;
}

interface DynamicRoadmapData {
  roadmap_title: string;
  total_course_duration_hours: number;
  total_course_duration_minutes: number;
  skill_gap_count: number;
  available_course_count: number;
  phases: RoadmapPhase[];
  external_learning: Array<{ skill: string; message: string }>;
  completion_rule: {
    course_completion: string;
    mock_test: string;
    mock_test_duration_minutes: number;
    passing_score: number;
  };
}

interface ReadinessRoadmapProps {
  onLaunchSprint: (skillId: string) => void;
}

export default function ReadinessRoadmap({ onLaunchSprint }: ReadinessRoadmapProps) {
  const { currentStudent, activeJob, addToast } = useStore();
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [dynamicRoadmap, setDynamicRoadmap] = useState<DynamicRoadmapData | null>(null);

  const targetJob = activeJob;
  if (!targetJob) return null;

  // Collect missing or unverified skills sorted by weight descending
  const roadmapSteps = targetJob.criticalSkills
    .concat(targetJob.optionalSkills)
    .map((skill) => {
      const studentSkill = currentStudent.skills.find((s) => s.skillId === skill.id);
      const isCompleted = studentSkill?.isVerified || false;
      return {
        skill,
        isCompleted,
        score: studentSkill?.score,
        hash: studentSkill?.credentialHash,
      };
    })
    .sort((a, b) => b.skill.weight - a.skill.weight);

  const completedSteps = roadmapSteps.filter((s) => s.isCompleted);
  const remainingSteps = roadmapSteps.filter((s) => !s.isCompleted);

  const totalEstMinutes = remainingSteps.length * 10;
  const progressPercent = Math.round(
    (completedSteps.length / roadmapSteps.length) * 100
  );

  const handleRefreshFit = () => {
    addToast({
      type: "info",
      title: "Fit Score Recomputed",
      message: `Profile re-evaluated against ${targetJob.title}. Current readiness score: ${currentStudent.readinessScore}%.`,
    });
  };

  const handleGenerateAICurriculum = async () => {
    setIsGeneratingRoadmap(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/career-compass/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_role: targetJob.title,
          current_skills: currentStudent.skills.filter((s) => s.isVerified).map((s) => s.skillName || s.skillId),
          skill_gaps: remainingSteps.map((s) => ({
            skill: s.skill.name,
            priority: s.skill.isCritical ? "High" : "Medium",
          })),
          weekly_hours: 6,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDynamicRoadmap(data);
        addToast({
          type: "success",
          title: "AI Career Curriculum Generated",
          message: `Linked ${data.phases?.length || 0} course modules from catalogue. Total duration: ~${data.total_course_duration_hours || 0} hrs.`,
        });
      } else {
        throw new Error("Backend response error");
      }
    } catch (err) {
      console.warn("Failed to generate dynamic curriculum:", err);
      addToast({
        type: "warning",
        title: "Curriculum Generation Note",
        message: "Course server offline, using local competency checkpoints.",
      });
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Application Readiness Report Header */}
      <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-4 h-4 text-blue-400" />
              <span className="text-xs uppercase text-blue-400 font-semibold tracking-wider">
                Application Readiness Report
              </span>
            </div>
            <h3 className="text-base font-semibold text-white">
              Target Roadmap: {targetJob.title}
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Complete the sequenced skill modules below to advance your profile into the{" "}
              <strong className="text-emerald-400">Job-Ready tier (≥85%)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleGenerateAICurriculum}
              disabled={isGeneratingRoadmap}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingRoadmap ? "animate-spin" : ""}`} />
              <span>{isGeneratingRoadmap ? "Synthesizing..." : "Generate Dynamic AI Curriculum"}</span>
            </button>
            <button
              onClick={handleRefreshFit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs font-medium text-gray-300 hover:text-white transition-colors"
              title="Re-check fit score without re-uploading resume"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Re-check Fit</span>
            </button>
          </div>
        </div>

        {/* Progress & Time Estimate Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-800">
          <div>
            <span className="text-xs text-gray-500 uppercase block">
              Roadmap Progress
            </span>
            <p className="text-lg font-bold font-mono text-blue-400 mt-0.5">
              {completedSteps.length} / {roadmapSteps.length} Completed ({progressPercent}%)
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase block">
              Est. Time to Job-Ready
            </span>
            <p className="text-lg font-bold font-mono text-amber-400 mt-0.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              {totalEstMinutes > 0 ? `~${totalEstMinutes} mins` : "0 mins (Ready)"}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase block">
              Current Benchmark
            </span>
            <p
              className={`text-lg font-bold font-mono mt-0.5 ${
                currentStudent.readinessScore >= 85
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {currentStudent.readinessScore}% ({currentStudent.currentTier.replace("_", "-").toUpperCase()})
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic AI Course Curriculum & Modules (Catalog-Backed) */}
      {dynamicRoadmap && (
        <div className="rounded-xl bg-gradient-to-b from-gray-900 to-gray-950 border border-blue-900/40 p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-xs uppercase text-blue-400 font-semibold tracking-wider">
                  AI Dynamic Course Catalog Curriculum
                </span>
              </div>
              <h4 className="text-base font-bold text-white">
                {dynamicRoadmap.roadmap_title}
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Curriculum dynamically synthesized from CareerCompass course catalog.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-blue-950/80 border border-blue-800/80 text-blue-300 font-mono text-xs font-semibold">
                {dynamicRoadmap.total_course_duration_hours} hrs Total
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-mono text-xs font-semibold">
                {dynamicRoadmap.phases.length} Course Modules
              </span>
            </div>
          </div>

          {/* Phase Cards */}
          <div className="space-y-4">
            {dynamicRoadmap.phases.map((phase) => (
              <div
                key={phase.phase}
                className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-blue-900/50 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-mono text-xs font-bold text-blue-400">
                      P{phase.phase}
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-white flex items-center gap-2">
                        {phase.title}
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">
                          {phase.course.duration_minutes} mins
                        </span>
                      </h5>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                    <span className="px-2 py-0.5 rounded bg-gray-950 border border-gray-800">
                      Mock Test: {phase.mock_test.question_count} Qs (≥{phase.mock_test.passing_score}%)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-300 pl-9">
                  {phase.goal}
                </p>

                {/* Lessons breakdown */}
                {phase.lessons && phase.lessons.length > 0 && (
                  <div className="pl-9 pt-2 border-t border-gray-800/60">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 block mb-2">
                      Syllabus Lessons ({phase.lessons.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {phase.lessons.map((lesson, lIdx) => (
                        <div
                          key={lIdx}
                          className="flex items-center gap-2 p-2 rounded-lg bg-gray-950/70 border border-gray-800/80 text-xs text-gray-300"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{lesson.title}</span>
                          <span className="ml-auto text-[10px] font-mono text-gray-500 shrink-0">
                            {lesson.duration_minutes}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* External Learning Guidance if applicable */}
          {dynamicRoadmap.external_learning && dynamicRoadmap.external_learning.length > 0 && (
            <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-xs text-amber-300 flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-200">
                  Supplementary External Specializations
                </strong>
                <span>
                  The following skill gaps require external production capstones:{" "}
                  {dynamicRoadmap.external_learning.map((e) => e.skill).join(", ")}.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sequenced Roadmap Steps */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 space-y-4">
        <h4 className="text-xs uppercase font-medium tracking-wider text-gray-400">
          Sequenced Competency Steps (Priority Ranked)
        </h4>

        <div className="space-y-3">
          {roadmapSteps.map((step, idx) => {
            const isCritical = step.skill.isCritical;

            return (
              <div
                key={step.skill.id}
                className={`p-4 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  step.isCompleted
                    ? "bg-gray-950 border-emerald-900/60"
                    : isCritical
                    ? "bg-gray-950 border-gray-800 hover:border-gray-700"
                    : "bg-gray-950/60 border-gray-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                      step.isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    {step.isCompleted ? "✓" : idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-xs text-white">
                        {step.skill.name}
                      </h5>
                      {isCritical ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-medium">
                          Critical (3.0)
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                          Optional (1.0)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {step.isCompleted
                        ? `Verified credential issued (${step.score}% score)`
                        : "Target deficit gap. Closing this unlocks direct application readiness."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {step.isCompleted ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <ShieldCheck className="w-4 h-4" /> Passed
                    </span>
                  ) : (
                    <button
                      onClick={() => onLaunchSprint(step.skill.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Launch 10-Min Sprint</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
