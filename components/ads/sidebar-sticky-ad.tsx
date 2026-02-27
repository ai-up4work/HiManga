"use client";

import { useState, useRef, useEffect } from "react";

export function SidebarStickyAd() {
  const [adLoaded, setAdLoaded] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adRef.current) return;

    const script = document.createElement("script");
    script.src = "//whephiwach.com/XXXXXXXX/invoke.js"; // 🔴 Replace with your Monetag Banner Zone ID
    script.setAttribute("data-cfasync", "false");
    script.setAttribute("type", "text/javascript");
    script.async = true;
    script.onload = () => setTimeout(() => setAdLoaded(true), 500);
    adRef.current.appendChild(script);

    return () => {
      if (adRef.current) adRef.current.innerHTML = "";
    };
  }, []);

  return (
    <div className="flex-shrink-0 border-t border-slate-700/40 bg-slate-900/95 backdrop-blur-md">
      <p className="text-[9px] text-slate-600 text-center pt-1 select-none tracking-wide uppercase">
        Advertisement
      </p>

      {!adLoaded && (
        <div className="mx-2 mb-2 h-[90px] rounded-lg overflow-hidden bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/30 flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.07A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">Support the site</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Ads keep the manga free</p>
          </div>
        </div>
      )}

      <div
        ref={adRef}
        style={{ minHeight: adLoaded ? "90px" : "0px" }}
        className="w-full"
      />
    </div>
  );
}