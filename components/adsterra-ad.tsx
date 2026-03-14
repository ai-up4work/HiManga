"use client";

import { useEffect, useRef } from "react";

interface AdsterraAdProps {
  // ── Script & zone ──────────────────────────────────────────────────────────
  scriptSrc: string;
  containerId: string;

  // ── Visibility ─────────────────────────────────────────────────────────────
  enabled?: boolean;

  // ── Layout ─────────────────────────────────────────────────────────────────
  centered?: boolean;
  fullWidth?: boolean;
  minHeight?: number;
  padding?: string;
  className?: string;

  // ── Label ──────────────────────────────────────────────────────────────────
  showLabel?: boolean;
  labelText?: string;
  labelPosition?: "top" | "bottom";

  // ── Border / background ────────────────────────────────────────────────────
  showBorder?: boolean;
  borderColor?: string;
  background?: string;
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
  const isEnabled =
    enabled !== undefined
      ? enabled
      : process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

  // Track by containerId — re-fires when containerId changes (chapter nav),
  // but does not double-fire within the same mount cycle.
  const lastContainerId = useRef<string | null>(null);

  useEffect(() => {
    if (!isEnabled) return;

    // Already injected for this exact container in this mount — skip.
    if (lastContainerId.current === containerId) return;
    lastContainerId.current = containerId;

    // Remove any stale script tagged to this container so the new chapter
    // container div gets a fresh execution.
    const existing = document.querySelector(
      `script[data-adsterra-container="${containerId}"]`
    );
    if (existing) existing.remove();

    const s = document.createElement("script");
    s.src = scriptSrc;
    s.async = true;
    s.setAttribute("data-cfasync", "false");
    s.setAttribute("data-adsterra-container", containerId);
    document.body.appendChild(s);

    return () => {
      // Clean up on unmount so the next mount always injects fresh.
      const el = document.querySelector(
        `script[data-adsterra-container="${containerId}"]`
      );
      if (el) el.remove();
      lastContainerId.current = null;
    };
  }, [isEnabled, scriptSrc, containerId]);

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