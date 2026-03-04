"use client";

import { useEffect, useRef } from "react";

interface AdsterraAdProps {
  // ── Script & zone ──────────────────────────────────────────────────────────
  scriptSrc: string;          // Adsterra invoke.js URL
  containerId: string;        // Adsterra container div id

  // ── Visibility ─────────────────────────────────────────────────────────────
  enabled?: boolean;          // hard on/off — defaults to NEXT_PUBLIC_ADS_ENABLED

  // ── Layout ─────────────────────────────────────────────────────────────────
  centered?: boolean;         // center the container horizontally
  fullWidth?: boolean;        // w-full on the container div
  minHeight?: number;         // min-height in px for the ad slot (default 0)
  padding?: string;           // tailwind padding classes e.g. "py-6 px-4"
  className?: string;         // extra classes on the outer wrapper

  // ── Label ──────────────────────────────────────────────────────────────────
  showLabel?: boolean;        // show "Advertisement" label (default false)
  labelText?: string;         // custom label text (default "Advertisement")
  labelPosition?: "top" | "bottom"; // where the label appears (default "top")

  // ── Border / background ────────────────────────────────────────────────────
  showBorder?: boolean;       // show top/bottom border (default false)
  borderColor?: string;       // tailwind border color class (default "border-slate-700/40")
  background?: string;        // tailwind bg class (default "bg-transparent")
}

export function AdsterraAd({
  scriptSrc,
  containerId,
  enabled,
  centered = true,
  fullWidth = true,
  minHeight = 0,
  padding = "py-6",
  className = "",
  showLabel = false,
  labelText = "Advertisement",
  labelPosition = "top",
  showBorder = false,
  borderColor = "border-slate-700/40",
  background = "bg-transparent",
}: AdsterraAdProps) {
  // Resolve enabled: prop takes priority, falls back to env var
  const isEnabled =
    enabled !== undefined
      ? enabled
      : process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

  const injected = useRef(false);

  useEffect(() => {
    if (!isEnabled) return;
    if (injected.current) return;
    if (document.querySelector(`script[src="${scriptSrc}"]`)) return;

    const s = document.createElement("script");
    s.src = scriptSrc;
    s.async = true;
    s.setAttribute("data-cfasync", "false");
    document.body.appendChild(s);

    injected.current = true;
  }, [isEnabled, scriptSrc]);

  if (!isEnabled) return null;

  const label = (
    <p className="text-[10px] text-slate-600 uppercase tracking-widest select-none">
      {labelText}
    </p>
  );

  return (
    <div
      className={[
        "flex flex-col",
        centered ? "items-center" : "",
        padding,
        background,
        showBorder ? `border-y ${borderColor}` : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showLabel && labelPosition === "top" && label}

      <div
        id={containerId}
        style={{ minHeight: minHeight > 0 ? `${minHeight}px` : undefined }}
        className={fullWidth ? "w-full" : ""}
      />

      {showLabel && labelPosition === "bottom" && label}
    </div>
  );
}