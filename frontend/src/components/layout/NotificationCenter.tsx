"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCheck,
  Clock,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { UserNotification } from "@/types";

interface NotificationCenterProps {
  userId?: string;
}

export default function NotificationCenter({ userId = "cand-1" }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/notifications?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.warn("Could not fetch notifications from backend:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      if (!isCancelled) {
        await fetchNotifications();
      }
    })();
    const interval = setInterval(fetchNotifications, 20000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`http://localhost:8000/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      if (!res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));
    setUnreadCount(0);

    try {
      await fetch("http://localhost:8000/api/v1/notifications/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      fetchNotifications();
    }
  };

  const displayedNotifications = notifications.filter((notif) =>
    activeTab === "unread" ? !notif.is_read : true
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors border ${
          isOpen
            ? "bg-gray-800 text-white border-gray-700"
            : unreadCount > 0
            ? "bg-gray-900 text-gray-200 border-gray-700 hover:text-white hover:border-gray-600"
            : "bg-transparent text-gray-400 border-transparent hover:text-gray-200 hover:bg-gray-800"
        }`}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center px-1 rounded-full bg-blue-600 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          id="notification-dropdown-panel"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-gray-800 bg-gray-900 shadow-xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <p className="text-xs text-gray-400">
                {unreadCount === 0 ? "All caught up" : `${unreadCount} unread`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                disabled={isLoading}
                title="Refresh notifications"
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-800 text-xs bg-gray-950/40">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded font-medium text-xs transition-colors ${
                activeTab === "all"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`px-2.5 py-1 rounded font-medium text-xs transition-colors flex items-center gap-1.5 ${
                activeTab === "unread"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-900/60 text-blue-400 text-[10px] font-mono flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-800">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                <span>Loading notifications...</span>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-gray-400" />
                </div>
                <p className="font-medium text-gray-300">No notifications</p>
                <p className="text-xs text-gray-500 max-w-[200px]">
                  {activeTab === "unread"
                    ? "You have marked all notifications as read."
                    : "No notifications at this time."}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const isDeadline = notif.notification_type === "deadline_warning";
                return (
                  <div
                    key={notif.id}
                    id={`notification-item-${notif.id}`}
                    onClick={() => {
                      if (!notif.is_read) {
                        markAsRead(notif.id);
                      }
                    }}
                    className={`p-3.5 transition-colors cursor-pointer ${
                      !notif.is_read
                        ? "bg-gray-850 hover:bg-gray-800/80 border-l-2 border-l-blue-500"
                        : "hover:bg-gray-800/50 opacity-75 hover:opacity-100 border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`w-7 h-7 rounded-md shrink-0 flex items-center justify-center border mt-0.5 ${
                          !notif.is_read
                            ? notif.notification_type === "job_match"
                              ? "bg-emerald-950 border-emerald-800 text-emerald-400"
                              : isDeadline
                              ? "bg-amber-950 border-amber-800 text-amber-400"
                              : "bg-blue-950 border-blue-800 text-blue-400"
                            : "bg-gray-800 border-gray-700 text-gray-400"
                        }`}
                      >
                        {notif.notification_type === "job_match" ? (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isDeadline ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${
                              !notif.is_read
                                ? notif.notification_type === "job_match"
                                  ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                  : isDeadline
                                  ? "bg-amber-950 text-amber-300 border-amber-800"
                                  : "bg-blue-950 text-blue-300 border-blue-800"
                                : "bg-gray-800 text-gray-400 border-gray-700"
                            }`}
                          >
                            {notif.notification_type === "job_match"
                              ? "Job Match"
                              : isDeadline
                              ? "Deadline Alert"
                              : "Application Window"}
                          </span>

                          <span className="text-[10px] text-gray-500">
                            {notif.trigger_date}
                          </span>
                        </div>

                        {/* Title & Message */}
                        <p className={`text-xs leading-relaxed ${!notif.is_read ? "font-medium text-gray-200" : "text-gray-400"}`}>
                          {notif.message}
                        </p>

                        {/* Metadata Footer */}
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-800/60 text-[11px] text-gray-400">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span>Deadline: {notif.application_deadline ? notif.application_deadline.split(" ")[0] : notif.trigger_date}</span>
                          </div>

                          {!notif.is_read ? (
                            <button
                              onClick={(e) => markAsRead(notif.id, e)}
                              className="text-blue-400 hover:text-blue-300 text-xs font-medium hover:underline"
                            >
                              Mark read
                            </button>
                          ) : (
                            <span className="text-gray-500 text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-gray-500" /> Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-gray-950/60 border-t border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>Automated deadline & application alerts</span>
            <span className="text-gray-400">Aspire AI Alerts</span>
          </div>
        </div>
      )}
    </div>
  );
}
