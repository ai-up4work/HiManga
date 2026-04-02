// components/NotificationsPanel.tsx
"use client";

import { Bell, X, CheckCheck, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNotifications } from "@/hooks/use-notifications";
import Image from "next/image";

// ✅ HiManga News WhatsApp Group
const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/EZMgepAXAvA5uVEG9CkPyu";

// QR code image — swap this for a hosted URL in production
const QR_CODE_SRC = "/logos/whatsapp-qr.png";

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 24, height: 24, flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsMobile(
        /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
          (window.innerWidth < 768 && "ontouchstart" in window)
      );
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

interface NotificationsPanelProps {
  userId: string | null;
}

export default function NotificationsPanel({ userId }: NotificationsPanelProps) {
  const {
    notifications,
    unreadCount,
    isLoaded,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications(userId);

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // ── WHATSAPP BANNER (shared between mobile & desktop) ──
  const WhatsAppBanner = (
    <div className="px-4 pb-2">
      {isMobile ? (
        /* Mobile: tap-to-open button */
        <a
          href={WHATSAPP_GROUP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 hover:border-green-400/60 transition-all duration-300 group"
        >
          <span className="text-green-400 group-hover:scale-110 transition-transform duration-300">
            {WA_ICON}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-green-300 font-black text-sm uppercase tracking-wider system-font">
              Get Instant Chapter Alerts
            </p>
            <p className="text-green-400/70 text-xs font-medium mt-0.5">
              Join our WhatsApp group → be the first to know!
            </p>
          </div>
          <span className="text-green-400 font-bold text-lg group-hover:translate-x-1 transition-transform duration-300">
            →
          </span>
        </a>
      ) : (
        /* Desktop: inline QR card */
        <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-green-500/40 bg-green-500/10">
          {/* QR code */}
          <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border border-green-500/30 bg-white p-1">
            <Image
              src={QR_CODE_SRC}
              alt="WhatsApp QR code"
              width={200}
              height={200}
              className="object-contain"
            />
          </div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400">{WA_ICON}</span>
              <p className="text-green-300 font-black text-sm uppercase tracking-wider system-font">
                Get Instant Chapter Alerts
              </p>
            </div>
            <p className="text-green-400/70 text-xs font-medium leading-relaxed">
              Scan with your phone's WhatsApp camera to join our group and be the first to know about new chapters!
            </p>
            {/* Fallback link */}
            <a
              href={WHATSAPP_GROUP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1.5 text-xs text-green-400/60 hover:text-green-300 underline underline-offset-2 transition-colors duration-200"
            >
              Or open link manually →
            </a>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:text-pink-500 rounded-lg transition-colors text-white/70"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-lg shadow-blue-500/50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] animate-fadeIn"
              onClick={() => setIsOpen(false)}
            />

            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-2xl animate-systemAppear">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-xl animate-pulse" />

                  <div className="relative bg-gradient-to-b from-slate-900/95 to-black/95 border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20 flex flex-col max-h-[80vh]">
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-blue-400/50 pointer-events-none z-10" />
                    <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-blue-400/50 pointer-events-none z-10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-blue-400/50 pointer-events-none z-10" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-blue-400/50 pointer-events-none z-10" />

                    {/* ── HEADER ── */}
                    <div className="relative flex-shrink-0 border-b-2 border-blue-500/30 bg-gradient-to-r from-slate-900/60 via-blue-900/20 to-slate-900/60 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50">
                            <Bell className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl sm:text-3xl font-black tracking-wider text-white uppercase system-font">
                              Notifications
                            </h2>
                            <p className="text-blue-300 text-sm font-bold tracking-wide">
                              {unreadCount} Unread
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsOpen(false)}
                          className="text-slate-400 hover:text-white transition-colors duration-300 p-2 hover:bg-slate-800/50 rounded-lg"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Action buttons */}
                      {notifications.length > 0 && (
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 transition-all duration-300 font-bold text-sm tracking-wide uppercase"
                          >
                            <CheckCheck className="w-4 h-4" />
                            Mark All Read
                          </button>
                          <button
                            onClick={clearAll}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-red-900/30 border border-blue-500/30 hover:border-red-500/50 text-blue-300 hover:text-red-300 transition-all duration-300 font-bold text-sm tracking-wide uppercase"
                          >
                            <Trash2 className="w-4 h-4" />
                            Clear All
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── NOTIFICATIONS LIST ── */}
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                      {!isLoaded ? (
                        <div className="p-12 text-center">
                          <p className="text-slate-400">Loading notifications...</p>
                        </div>
                      ) : error ? (
                        <div className="p-12 text-center">
                          <p className="text-red-400">{error}</p>
                        </div>
                      ) : notifications.length > 0 ? (
                        <div className="pt-4 space-y-3">
                          {/* ── WHATSAPP BANNER inside scroll area ── */}
                          {WhatsAppBanner}

                          <div className="px-4 space-y-3">
                            {notifications.map((notification, index) => (
                              <div
                                key={notification.id}
                                className={`relative group transition-all duration-300 ${
                                  !notification.read
                                    ? "animate-slideIn"
                                    : "opacity-70 hover:opacity-100"
                                }`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                              >
                                <div
                                  className={`relative bg-gradient-to-r ${
                                    !notification.read
                                      ? "from-slate-800/80 to-slate-900/80 border-2 border-blue-400/40"
                                      : "from-slate-800/40 to-slate-900/40 border-2 border-slate-700/40"
                                  } p-4 transition-all duration-300 hover:border-blue-400/60 group-hover:shadow-lg group-hover:shadow-blue-500/20`}
                                >
                                  <div className="flex gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <h4 className="font-black text-lg text-white uppercase tracking-wider mb-2 system-font">
                                            {notification.title}
                                          </h4>
                                          <p className="text-slate-300 text-sm font-medium leading-relaxed">
                                            {notification.message}
                                          </p>
                                        </div>
                                        <button
                                          onClick={() => removeNotification(notification.id)}
                                          className="text-slate-500 hover:text-red-400 transition-colors duration-300 p-1 hover:bg-slate-800/50 rounded"
                                        >
                                          <X className="w-5 h-5" />
                                        </button>
                                      </div>

                                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
                                        <span className="text-xs text-blue-400 font-bold tracking-wide uppercase">
                                          {formatTimestamp(notification.created_at)}
                                        </span>
                                        {!notification.read && (
                                          <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors duration-300 uppercase tracking-wide hover:underline"
                                          >
                                            → Mark as Read
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {!notification.read && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 animate-pulse" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Empty state: show banner + empty message */
                        <div className="pt-4 space-y-4">
                          {WhatsAppBanner}
                          <div className="p-12 text-center">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border-2 border-blue-500/20">
                              <Bell className="w-12 h-12 text-slate-600" />
                            </div>
                            <p className="text-xl font-black text-slate-500 uppercase tracking-wider system-font">
                              No Notifications
                            </p>
                            <p className="text-sm text-slate-600 mt-2 font-medium">
                              You're all caught up!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── FOOTER ── */}
                    <div className="flex-shrink-0 border-t-2 border-blue-500/30 bg-gradient-to-r from-slate-900/60 via-blue-900/20 to-slate-900/60 p-4">
                      <div className="flex items-center justify-between text-xs text-blue-400 font-bold tracking-wider uppercase">
                        <span>Notification Center</span>
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

      <style jsx>{`
        .system-font {
          font-family: Impact, "Arial Black", sans-serif;
          text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes systemAppear {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-systemAppear {
          animation: systemAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-slideIn {
          animation: slideIn 0.4s ease-out forwards;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </>
  );
}