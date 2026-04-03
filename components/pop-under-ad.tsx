"use client";

import { useEffect } from "react";

const POP_UNDER_SCRIPT_SRC =
  "https://pl29034698.profitablecpmratenetwork.com/a6/e7/54/a6e754a9ae9f1f4062d0b4fae2d82cb5.js";
const SCRIPT_ID = "adsterra-popunder-logic";
const STORAGE_KEY = "pu_last_fired";
const DELAY_MS = 3000;                  // 3s after mount
const MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 mins between fires

export function PopUnderAd() {
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const last = localStorage.getItem(STORAGE_KEY);
        const now = Date.now();

        // Block if fired less than 5 mins ago
        if (last && now - parseInt(last) < MIN_INTERVAL_MS) return;

        // Block if script already injected this session
        if (document.getElementById(SCRIPT_ID)) return;

        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = POP_UNDER_SCRIPT_SRC;
        script.async = true;
        script.type = "text/javascript";
        document.body.appendChild(script);

        // Record fire time
        localStorage.setItem(STORAGE_KEY, String(now));
      } catch {
        // Silently fail — never break reading experience
      }
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  return null;
}