"use client";

import { useEffect } from "react";

const POP_UNDER_SCRIPT_SRC =
  "https://pl29034698.profitablecpmratenetwork.com/a6/e7/54/a6e754a9ae9f1f4062d0b4fae2d82cb5.js";
const SCRIPT_ID = "adsterra-popunder-logic";

export function PopUnderAd() {
  useEffect(() => {
    // 1. Prevent duplicate injection if the script already exists
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = POP_UNDER_SCRIPT_SRC;
    script.async = true;
    script.type = "text/javascript";
    
    document.body.appendChild(script);

    return () => {
      // 2. Comprehensive Cleanup
      const existingScript = document.getElementById(SCRIPT_ID);
      if (existingScript && document.body.contains(existingScript)) {
        document.body.removeChild(existingScript);
      }

      // 3. Optional: Clear common global vars used by these networks 
      // to reset the 'has-fired' state for the next visit.
      // (Check your specific script source if it uses a unique namespace)
      if (typeof (window as any)._at !== "undefined") {
        (window as any)._at = null;
      }
    };
  }, []);

  return null; 
}