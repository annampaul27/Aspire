"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Mic, CheckCircle2, AlertCircle, X } from "lucide-react";

interface DeviceCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReady: (stream: MediaStream | null) => void;
}

export default function DeviceCheckModal({ isOpen, onClose, onReady }: DeviceCheckModalProps) {
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;

    async function setupDevices() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCamera(true);
        setHasMic(true);

        // Setup Audio Analyser for live mic level meter
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContext = new AudioCtx();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateAudioMeter = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateAudioMeter);
        };
        updateAudioMeter();
      } catch (err: unknown) {
        console.warn("Hardware permission error or unavailable:", err);
        const error = err as Error;
        setErrorMessage(error.message || "Camera or microphone permissions were denied.");
        setHasCamera(false);
        setHasMic(false);
      }
    }

    setupDevices();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContext && audioContext.state !== "closed") audioContext.close();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onReady(streamRef.current);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold flex items-center gap-2">
          <Camera className="h-5 w-5 text-emerald-400" />
          Camera & Audio Hardware Check
        </h3>
        <p className="mt-1 text-sm text-gray-400">
          Calibrate your video feed and microphone before starting the AI mock interview.
        </p>

        {/* Video Preview */}
        <div className="mt-4 relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-gray-800 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          {!hasCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gray-900/90">
              <AlertCircle className="h-10 w-10 text-amber-400 mb-2" />
              <p className="text-sm font-medium text-gray-200">Camera Unavailable or Denied</p>
              <p className="text-xs text-gray-400 mt-1">You can still proceed in Simulated Telemetry Mode.</p>
            </div>
          )}
        </div>

        {/* Device Status Checkmarks */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-gray-800/80 bg-gray-900/60 p-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium">Webcam Video Stream</span>
            </div>
            {hasCamera ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Ready
              </span>
            ) : (
              <span className="text-xs text-amber-400">Simulated</span>
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-gray-800/80 bg-gray-900/60 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium">Microphone Input Level</span>
              </div>
              {hasMic ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> Detecting Voice
                </span>
              ) : (
                <span className="text-xs text-amber-400">Simulated</span>
              )}
            </div>
            {/* Live Audio Meter Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500 transition-all duration-75"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <p className="mt-3 text-xs text-amber-400/90 bg-amber-950/30 border border-amber-800/50 rounded-lg p-2.5">
            Note: {errorMessage}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950"
          >
            Enter Studio & Begin
          </button>
        </div>
      </div>
    </div>
  );
}
