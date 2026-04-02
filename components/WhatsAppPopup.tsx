"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/EZMgepAXAvA5uVEG9CkPyu";
const QR_CODE_SRC = "/logos/whatsapp-qr.png";
const DISMISSED_KEY = "wa_popup_dismissed";

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22, flexShrink: 0 }}>
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

interface WhatsAppPopupProps {
  /**
   * Delay in ms before the popup appears. Default: 5000 (5s).
   * Set to 0 to show immediately, or use triggerOnScroll instead.
   */
  delayMs?: number;
  /**
   * If true, shows popup after user scrolls 40% down the page instead of using a timer.
   * Takes precedence over delayMs.
   */
  triggerOnScroll?: boolean;
  /**
   * If true, the popup won't show again for the rest of the browser session once dismissed.
   * Default: true.
   */
  rememberDismiss?: boolean;
}

export function WhatsAppPopup({
  delayMs = 5000,
  triggerOnScroll = false,
  rememberDismiss = true,
}: WhatsAppPopupProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    if (rememberDismiss) {
      try {
        if (sessionStorage.getItem(DISMISSED_KEY)) return;
      } catch {}
    }

    if (triggerOnScroll) {
      const onScroll = () => {
        const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        if (scrolled >= 0.4) {
          setVisible(true);
          window.removeEventListener("scroll", onScroll);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    } else {
      const t = setTimeout(() => setVisible(true), delayMs);
      return () => clearTimeout(t);
    }
  }, [delayMs, triggerOnScroll, rememberDismiss]);

  const dismiss = () => {
    setVisible(false);
    if (rememberDismiss) {
      try {
        sessionStorage.setItem(DISMISSED_KEY, "1");
      } catch {}
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop — subtle, non-blocking */}
      <div
        aria-hidden="true"
        onClick={dismiss}
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
        style={{
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
        }}
      />

      {/* Popup card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Join our WhatsApp group"
        className="fixed z-50 transition-all duration-500 ease-out"
        style={{
          // Bottom-right on desktop, bottom-center on mobile
          bottom: isMobile ? "1rem" : "1.5rem",
          right: isMobile ? "1rem" : "1.5rem",
          left: isMobile ? "1rem" : "auto",
          maxWidth: isMobile ? "none" : "360px",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        <div className="relative border-2 border-green-500/40 bg-gradient-to-b from-slate-900 to-black shadow-2xl shadow-black/60">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-green-400/60 pointer-events-none" />
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-green-400/60 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-green-400/60 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-green-400/60 pointer-events-none" />

          {/* Close button */}
          <button
            onClick={dismiss}
            aria-label="Close"
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/10 rounded transition-all duration-200 text-lg leading-none"
          >
            ×
          </button>

          <div className="p-5 pr-10">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-green-400">{WA_ICON}</span>
              <p className="text-green-300 font-black text-sm uppercase tracking-wider system-font">
                Never miss a chapter
              </p>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              {isMobile
                ? "Join our WhatsApp group — new chapters straight to your phone."
                : "Scan the QR or tap below to join our WhatsApp group. New chapters, straight to your phone."}
            </p>

            {/* QR code — desktop only */}
            {!isMobile && (
              <div className="flex justify-center mb-4">
                <div className="w-28 h-28 border border-green-500/30 bg-white p-1.5 rounded">
                  <Image
                    src={QR_CODE_SRC}
                    alt="WhatsApp group QR code"
                    width={200}
                    height={200}
                    className="object-contain w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* CTA */}
            <a
              href={WHATSAPP_GROUP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-green-500/50 bg-green-500/15 hover:bg-green-500/25 hover:border-green-400/70 text-green-300 font-black text-sm uppercase tracking-wider transition-all duration-300 group system-font"
            >
              <span className="text-green-400">{WA_ICON}</span>
              Join the group
              <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
            </a>

            {/* Dismiss link */}
            <button
              onClick={dismiss}
              className="mt-3 w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors duration-200"
            >
              No thanks
            </button>
          </div>
        </div>
      </div>
    </>
  );
}