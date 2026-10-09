"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Volume2,
  Mic,
  Square,
  Sparkles,
  Zap,
  AlertCircle,
  HelpCircle,
  Send,
  Camera,
} from "lucide-react";
import {
  interviewCoachApi,
  RoleTopicPreset,
  InterviewQuestionResponse,
  FollowUpProbeResponse,
  HireabilityEvaluationReport,
} from "@/lib/api/interviewCoach";
import SpeechTelemetryHUD from "./SpeechTelemetryHUD";
import EvaluationReportModal from "./EvaluationReportModal";
import DeviceCheckModal from "./DeviceCheckModal";

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
  };
  length: number;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEventLike) => void;
  onerror: (event: unknown) => void;
  start: () => void;
  stop: () => void;
}

export default function LiveInterviewStage() {
  const [presets, setPresets] = useState<RoleTopicPreset[]>([]);
  const [selectedRole, setSelectedRole] = useState("Senior Backend Engineer");
  const [selectedTopic, setSelectedTopic] = useState("Distributed Systems & Partitioning");
  const [difficulty, setDifficulty] = useState("senior");
  const [isCustom, setIsCustom] = useState(false);

  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [question, setQuestion] = useState<InterviewQuestionResponse | null>(null);

  // Video stream state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  // Audio / Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Live telemetry estimates
  const [wpm, setWpm] = useState(0);
  const [cadenceRating, setCadenceRating] = useState("Optimal");
  const [fillerCount, setFillerCount] = useState(0);
  const [detectedFillers, setDetectedFillers] = useState<string[]>([]);
  const [eyeContactPercent, setEyeContactPercent] = useState(85);
  const [headStabilityScore, setHeadStabilityScore] = useState(90);

  // Follow-up & Evaluation state
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);
  const [followUp, setFollowUp] = useState<FollowUpProbeResponse | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<HireabilityEvaluationReport | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Compute live telemetry (WPM, Fillers) - Hoisted before useEffect
  const computeLiveTelemetry = useCallback((text: string, seconds: number) => {
    const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
    const count = words.length;
    const safeSecs = Math.max(1, seconds);
    const calcWpm = Math.round((count / safeSecs) * 60);
    setWpm(calcWpm);

    if (calcWpm < 110) setCadenceRating("Too Slow");
    else if (calcWpm < 125) setCadenceRating("Slightly Slow");
    else if (calcWpm <= 165) setCadenceRating("Optimal");
    else if (calcWpm <= 190) setCadenceRating("Slightly Fast");
    else setCadenceRating("Too Fast");

    const fillers = ["um", "uh", "like", "actually", "basically", "you know", "literally", "right"];
    let detectedCount = 0;
    const found: string[] = [];
    words.forEach((w) => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, "");
      if (fillers.includes(clean)) {
        detectedCount++;
        if (!found.includes(clean)) found.push(clean);
      }
    });
    setFillerCount(detectedCount);
    setDetectedFillers(found);
  }, []);

  // 1. Fetch Presets
  useEffect(() => {
    async function loadPresets() {
      try {
        const data = await interviewCoachApi.getPresets();
        setPresets(data);
        if (data.length > 0) {
          setSelectedRole(data[0].role);
          setSelectedTopic(data[0].topic);
        }
      } catch (err) {
        console.warn("Using default preset fallback:", err);
      }
    }
    loadPresets();
  }, []);

  // 2. Attach Stream to Video
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // 3. Setup Web Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      };
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;

        recog.onresult = (event: SpeechRecognitionEventLike) => {
          let currentText = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
          computeLiveTelemetry(currentText, elapsedSeconds);
        };

        recog.onerror = (e: unknown) => {
          console.warn("Speech recognition error:", e);
        };

        recognitionRef.current = recog;
      }
    }
  }, [elapsedSeconds, computeLiveTelemetry]);

  // 4. Generate Question
  const handleGenerateQuestion = async () => {
    setIsLoadingQuestion(true);
    setQuestion(null);
    setFollowUp(null);
    setTranscript("");
    setElapsedSeconds(0);

    try {
      const res = await interviewCoachApi.generateQuestion({
        role: selectedRole,
        topic: selectedTopic,
        difficulty,
      });
      setQuestion(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Failed to generate question: " + msg);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // 5. Speak Question via SpeechSynthesis
  const handleSpeakQuestion = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // 6. Toggle Microphone Recording
  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTranscript("");
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          computeLiveTelemetry(transcript, next);
          return next;
        });
      }, 1000);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // already started
        }
      }
    } else {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // already stopped
        }
      }
    }
  };

  // 7. Trigger Follow-Up Grill
  const handleTriggerFollowUp = async () => {
    if (!question) return;
    setIsLoadingFollowUp(true);
    try {
      const res = await interviewCoachApi.generateFollowUp(
        question.question_scenario,
        transcript || "We deployed a distributed cache with TTL and Kafka for asynchronous queueing.",
        selectedRole
      );
      setFollowUp(res);
      handleSpeakQuestion(res.probe_question);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Failed to generate follow-up: " + msg);
    } finally {
      setIsLoadingFollowUp(false);
    }
  };

  // 8. Submit & Evaluate
  const handleSubmitEvaluation = async () => {
    if (!question) return;
    setIsEvaluating(true);
    try {
      const res = await interviewCoachApi.evaluateSession({
        question_id: question.question_id,
        role: selectedRole,
        question_text: question.question_scenario,
        candidate_transcript: transcript || "Standard partitioned queue with idempotency keys.",
        audio_duration_seconds: Math.max(12, elapsedSeconds),
        eye_contact_ratio: eyeContactPercent / 100.0,
        head_stability_score: headStabilityScore,
        is_follow_up: !!followUp,
      });
      setEvaluationReport(res);
      setIsReportOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Evaluation failed: " + msg);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            {/* Role Select */}
            <div>
              <label className="text-xs font-semibold uppercase text-gray-400 block mb-1.5">
                Target Engineering Role
              </label>
              <select
                value={isCustom ? "custom" : selectedRole}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setIsCustom(true);
                  } else {
                    setIsCustom(false);
                    setSelectedRole(e.target.value);
                    const match = presets.find((p) => p.role === e.target.value);
                    if (match) setSelectedTopic(match.topic);
                  }
                }}
                className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              >
                {presets.map((p) => (
                  <option key={p.role} value={p.role}>
                    {p.role}
                  </option>
                ))}
                <option value="custom">Custom Role / Topic</option>
              </select>
            </div>

            {/* Topic Select */}
            <div>
              <label className="text-xs font-semibold uppercase text-gray-400 block mb-1.5">
                Evaluation Topic
              </label>
              {isCustom ? (
                <input
                  type="text"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  placeholder="e.g. Raft Consensus, MVCC Bloat"
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              ) : (
                <input
                  type="text"
                  readOnly
                  value={selectedTopic}
                  className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-3.5 py-2.5 text-sm text-gray-300"
                />
              )}
            </div>

            {/* Seniority */}
            <div>
              <label className="text-xs font-semibold uppercase text-gray-400 block mb-1.5">
                Seniority Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              >
                <option value="senior">Senior Engineer</option>
                <option value="principal">Principal / Staff</option>
                <option value="mid">Mid-Level</option>
                <option value="junior">Junior Engineer</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDeviceModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              <Camera className="h-4 w-4 text-emerald-400" />
              Hardware Check
            </button>
            <button
              onClick={handleGenerateQuestion}
              disabled={isLoadingQuestion}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {isLoadingQuestion ? "Formulating Scenario..." : "Generate Question"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Question & Response vs Video & HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Question, Follow-up & Response */}
        <div className="lg:col-span-7 space-y-5">
          {/* Question Scenario Card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Technical Interview Scenario ({difficulty})
              </span>
              {question && (
                <button
                  onClick={() => handleSpeakQuestion(question.question_scenario)}
                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-emerald-400 bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-700"
                >
                  <Volume2 className="h-3.5 w-3.5" /> Listen
                </button>
              )}
            </div>

            {question ? (
              <>
                <p className="text-base font-medium leading-relaxed text-gray-100">
                  {question.question_scenario}
                </p>

                {/* Expected Keywords & Hints */}
                <div className="mt-4 pt-4 border-t border-gray-800/80 flex flex-col gap-2">
                  <div className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-gray-300">Target Keywords:</span>
                    {question.expected_keywords.map((k) => (
                      <span key={k} className="rounded-md bg-gray-800 px-2 py-0.5 font-mono text-[11px] text-emerald-400">
                        {k}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400">
                    <strong className="text-gray-300">Architectural Hints:</strong>{" "}
                    {question.hints.join(" • ")}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <HelpCircle className="h-10 w-10 mx-auto mb-2 opacity-40 text-emerald-400" />
                <p className="text-sm">Click &quot;Generate Question&quot; above to begin your live AI mock interview.</p>
              </div>
            )}
          </div>

          {/* Follow-up Probe Box (If triggered) */}
          {followUp && (
            <div className="rounded-2xl border border-amber-900/60 bg-gradient-to-r from-amber-950/30 to-gray-900/60 p-5 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> Adaptive Counter-Grill ({followUp.probe_focus})
                </span>
                <button
                  onClick={() => handleSpeakQuestion(followUp.probe_question)}
                  className="flex items-center gap-1 text-xs text-amber-300 hover:text-white bg-amber-900/40 px-2.5 py-1 rounded-lg border border-amber-700/50"
                >
                  <Volume2 className="h-3.5 w-3.5" /> Speak
                </button>
              </div>
              <p className="text-sm font-semibold text-amber-100">{followUp.probe_question}</p>
              {followUp.hint && (
                <p className="text-xs text-amber-300/80 mt-2 font-mono">💡 Hint: {followUp.hint}</p>
              )}
            </div>
          )}

          {/* Candidate Spoken Response Box */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                Candidate Verbal Response
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleRecording}
                  disabled={!question}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    isRecording
                      ? "bg-red-600 text-white animate-pulse"
                      : "bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40"
                  }`}
                >
                  {isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  {isRecording ? "Stop Recording" : "Start Speaking"}
                </button>
              </div>
            </div>

            <textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                computeLiveTelemetry(e.target.value, elapsedSeconds);
              }}
              placeholder="Your answer will be transcribed here in real-time as you speak, or you can paste your response..."
              rows={5}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-200 outline-none focus:border-emerald-500 font-sans leading-relaxed resize-none"
            />

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleTriggerFollowUp}
                disabled={!question || isLoadingFollowUp}
                className="flex items-center gap-1.5 rounded-xl border border-amber-700/60 bg-amber-950/30 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-900/40 disabled:opacity-40"
              >
                <Zap className="h-4 w-4 text-amber-400" />
                {isLoadingFollowUp ? "Analyzing..." : "Trigger Adaptive Follow-Up"}
              </button>

              <button
                onClick={handleSubmitEvaluation}
                disabled={!question || isEvaluating}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-950 disabled:opacity-40 ml-auto"
              >
                <Send className="h-3.5 w-3.5" />
                {isEvaluating ? "Evaluating Session..." : "Submit & Synthesize Scorecard"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Video Canvas & Live Telemetry HUD */}
        <div className="lg:col-span-5 space-y-5">
          {/* Video Preview */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-4 shadow-xl">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-gray-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {!stream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gray-900/90 text-gray-400">
                  <Camera className="h-8 w-8 text-emerald-400 mb-2 opacity-60" />
                  <span className="text-xs font-medium text-gray-300">Simulated Vision Telemetry Active</span>
                  <button
                    onClick={() => setIsDeviceModalOpen(true)}
                    className="mt-2 text-xs text-emerald-400 underline font-semibold"
                  >
                    Connect Hardware Camera
                  </button>
                </div>
              )}

              {/* HUD Badge Overlay */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="rounded-md bg-black/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                  👁️ Gaze: {eyeContactPercent}%
                </span>
                <span className="rounded-md bg-black/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-blue-400 border border-blue-500/30">
                  ⚡ {wpm} WPM
                </span>
              </div>
            </div>

            {/* Simulated Sliders for Calibration */}
            <div className="mt-4 pt-3 border-t border-gray-800/80 grid grid-cols-2 gap-3 text-xs text-gray-400">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Eye Contact Gaze</span>
                  <span className="text-white font-mono">{eyeContactPercent}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={eyeContactPercent}
                  onChange={(e) => setEyeContactPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Head Stability</span>
                  <span className="text-white font-mono">{headStabilityScore}/100</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={headStabilityScore}
                  onChange={(e) => setHeadStabilityScore(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Speech Telemetry HUD */}
          <SpeechTelemetryHUD
            wpm={wpm}
            cadenceRating={cadenceRating}
            fillerCount={fillerCount}
            detectedFillers={detectedFillers}
            eyeContactPercent={eyeContactPercent}
            headStabilityScore={headStabilityScore}
            elapsedSeconds={elapsedSeconds}
            isRecording={isRecording}
          />
        </div>
      </div>

      {/* Hardware Device Check Modal */}
      <DeviceCheckModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        onReady={(mediaStream) => setStream(mediaStream)}
      />

      {/* Evaluation Report Modal */}
      <EvaluationReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={evaluationReport}
      />
    </div>
  );
}
