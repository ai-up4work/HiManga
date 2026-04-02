"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/EZMgepAXAvA5uVEG9CkPyu";
const QR_CODE_SRC = "/logos/whatsapp-qr.png";

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, flexShrink: 0 }}>
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

interface WhatsAppBannerProps {
  /** Visual weight of the banner. "hero" = bold full-width section. "subtle" = compact strip. */
  variant?: "hero" | "subtle";
}

export function WhatsAppBanner({ variant = "hero" }: WhatsAppBannerProps) {
  const isMobile = useIsMobile();

  if (variant === "subtle") {
    return (
      <div className="w-full border-y border-green-500/20 bg-green-500/5 py-3 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-green-400">{WA_ICON}</span>
            <p className="text-green-300 text-sm font-bold tracking-wide uppercase system-font">
              Get instant chapter alerts
            </p>
            <p className="text-green-400/60 text-xs hidden sm:block">
              — join our WhatsApp group
            </p>
          </div>
          <a
            href={WHATSAPP_GROUP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-1.5 rounded border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 hover:border-green-400/60 text-green-300 text-xs font-black uppercase tracking-wider transition-all duration-300 group system-font"
          >
            Join now
            <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative border-2 border-green-500/30 bg-gradient-to-b from-slate-900/60 to-black/60 p-6 sm:p-8">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-green-400/50 pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-green-400/50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-green-400/50 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-green-400/50 pointer-events-none" />

          <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row items-center"}`}>
            {/* Desktop: QR code */}
            {!isMobile && (
              <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden border border-green-500/30 bg-white p-1">
                <Image
                  src={QR_CODE_SRC}
                  alt="WhatsApp QR code"
                  width={200}
                  height={200}
                  className="object-contain"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400">{WA_ICON}</span>
                <p className="text-green-300 font-black text-base uppercase tracking-wider system-font">
                  Never miss a new chapter
                </p>
              </div>
              <p className="text-slate-300 text-sm font-medium leading-relaxed mb-4">
                {isMobile
                  ? "Join our WhatsApp group and be the first to know when new chapters drop."
                  : "Scan the QR code or tap the button below to join our WhatsApp group. Be the first to know when new chapters drop — straight to your phone."}
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href={WHATSAPP_GROUP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 border-2 border-green-500/50 bg-green-500/15 hover:bg-green-500/25 hover:border-green-400/70 text-green-300 font-black text-sm uppercase tracking-wider transition-all duration-300 group system-font"
                >
                  <span className="text-green-400">{WA_ICON}</span>
                  Join the group
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
                </a>
                {!isMobile && (
                  <span className="flex items-center text-xs text-green-400/50 font-medium">
                    or scan the QR code
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}