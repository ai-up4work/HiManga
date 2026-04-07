"use client";

import { useState, useEffect } from "react";
import { Bell, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  manga_id: string;
  type: string;
  title: string;
  message: string;
  chapter_number: number | null;
  read: boolean;
  created_at: string;
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    fetchNotifications();
    checkPushSubscription();
  }, []);

  // Push notification functions
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  };

  const subscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;

      setPermission(perm);
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        )
      });

      // Save subscription to backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      setSubscribed(true);
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  };

  const checkPushSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setSubscribed(!!subscription);
    setPermission(Notification.permission);
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-slate-100">
                Notifications
              </h3>
              
              {/* Push Notifications Toggle */}
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={subscribePush}
                  disabled={subscribed}
                  className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 transition-all ${
                    subscribed
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200'
                  }`}
                  title="Enable push notifications (works when app closed)"
                >
                  {subscribed ? '🔔 Active' : '🔔 Enable'}
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-6 h-6 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-400 mt-2">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">
                    {subscribed 
                      ? 'Push notifications enabled! You\'ll get alerts for new chapters.' 
                      : 'No notifications yet. Enable push above!'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-slate-800/50 transition-colors ${
                        !notif.read ? "bg-cyan-500/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Unread indicator */}
                        <div className="flex-shrink-0 mt-1">
                          {!notif.read ? (
                            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={
                              notif.manga_id && notif.chapter_number
                                ? `/manga/${notif.manga_id}/chapter/${notif.chapter_number}`
                                : "#"
                            }
                            onClick={() => {
                              if (!notif.read) markAsRead(notif.id);
                              setIsOpen(false);
                            }}
                          >
                            <p className="font-medium text-sm text-slate-100 mb-1">
                              {notif.title}
                            </p>
                            <p className="text-xs text-slate-400 mb-2">
                              {notif.message}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(notif.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </Link>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="flex-shrink-0 p-1 rounded hover:bg-slate-700 transition-colors"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}