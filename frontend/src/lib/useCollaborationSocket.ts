"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CollaboratorPresence, PipelineStageEvent } from "@/types";
import { useStore } from "@/lib/store";

export interface UseCollaborationSocketOptions {
  orgId?: string;
  onStageChanged?: (event: PipelineStageEvent) => void;
  onScorecardSubmitted?: (data: any) => void;
  onNoteAdded?: (data: any) => void;
}

export function useCollaborationSocket({
  orgId = "org-acme",
  onStageChanged,
  onScorecardSubmitted,
  onNoteAdded,
}: UseCollaborationSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [peerCount, setPeerCount] = useState<number>(1);
  const [activeCollaborators, setActiveCollaborators] = useState<CollaboratorPresence[]>([]);
  const [lastEvent, setLastEvent] = useState<any>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { updateCandidatePipelineStatus, addToast } = useStore();

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    // Close previous socket if exists
    if (socketRef.current) {
      socketRef.current.close();
    }

    const token = localStorage.getItem("aspire_token");
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_WS_URL || "localhost:8000";
    const wsUrl = `${wsProtocol}//${host}/ws/hiring/${orgId}${token ? `?token=${encodeURIComponent(token)}` : ""}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Request active peers
        ws.send(JSON.stringify({ type: "REQUEST_PEERS" }));

        // Start heartbeat ping every 25 seconds
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING" }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: eventType, data } = payload;
          setLastEvent(payload);

          switch (eventType) {
            case "RECRUITER_JOINED":
            case "RECRUITER_LEFT":
            case "PEER_LIST":
              if (data?.peer_count !== undefined) {
                setPeerCount(data.peer_count);
              }
              if (data?.active_collaborators) {
                setActiveCollaborators(data.active_collaborators);
              }
              break;

            case "STAGE_CHANGED":
              if (data) {
                // Optimistically update candidate in global store if not already updated
                updateCandidatePipelineStatus(
                  data.candidate_id,
                  data.to_stage,
                  `Updated by ${data.changed_by?.name || "Peer Recruiter"}`
                );

                if (onStageChanged) {
                  onStageChanged(data);
                }

                addToast({
                  type: "info",
                  title: `🔄 Real-Time Pipeline Update`,
                  message: `${data.changed_by?.name || "A team member"} moved ${data.candidate_name || "candidate"} to ${data.to_stage.toUpperCase()}.`,
                });
              }
              break;

            case "SCORECARD_SUBMITTED":
              if (onScorecardSubmitted) {
                onScorecardSubmitted(data);
              }
              addToast({
                type: "info",
                title: `⭐ New Scorecard Evaluated`,
                message: `${data.scorecard?.reviewer_name || "A reviewer"} submitted a rating for candidate (${data.scorecard?.overall_recommendation?.toUpperCase()}).`,
              });
              break;

            case "NOTE_ADDED":
              if (onNoteAdded) {
                onNoteAdded(data);
              }
              addToast({
                type: "info",
                title: `💬 New Recruiter Note`,
                message: `${data.author_name || "A recruiter"} posted a private candidate note.`,
              });
              break;

            default:
              break;
          }
        } catch (e) {
          console.warn("WebSocket parse error:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        // Attempt reconnect in 3.5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3500);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.warn("WebSocket connection failure:", e);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }
  }, [orgId, updateCandidatePipelineStatus, onStageChanged, onScorecardSubmitted, onNoteAdded, addToast]);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [connect]);

  const sendTypingIndicator = useCallback(
    (candidateId: string) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "TYPING_NOTE",
            candidate_id: candidateId,
          })
        );
      }
    },
    []
  );

  return {
    isConnected,
    peerCount,
    activeCollaborators,
    lastEvent,
    sendTypingIndicator,
  };
}
