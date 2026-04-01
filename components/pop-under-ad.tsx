"use client";

import { useEffect } from "react";

const POP_UNDER_SCRIPT_SRC =
  "https://pl29034698.profitablecpmratenetwork.com/a6/e7/54/a6e754a9ae9f1f4062d0b4fae2d82cb5.js";

/**
 * PopUnderAd
 *
 * Injects the pop-under script once on mount and cleans it up on unmount.
 * The script itself waits for the first user click on the page before
 * opening the pop-under window — standard pop-under network behaviour.
 *
 * Usage: drop <PopUnderAd /> anywhere inside your layout/page tree.
 * Renders nothing visible.
 */
export function PopUnderAd() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = POP_UNDER_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up when the reader unmounts (e.g. route change)
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []); // run once on mount only

  return null; // no visible UI
}