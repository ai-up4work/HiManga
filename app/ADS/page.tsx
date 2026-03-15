"use client";

import { useEffect, useRef, useState } from "react";

const AD_LINK =
  "https://www.effectivegatecpm.com/hbk98sjq?key=67f2c5a7a9af8e30695edaa7a8c81650";
const DEST = "https://himanga.fun";
const WAIT = 5; // seconds on branded page before redirecting to ad

export default function AdInterstitialPage() {
  const [remaining, setRemaining] = useState(WAIT);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = (WAIT - remaining) / WAIT;
  const circumference = 283;
  const offset = circumference - circumference * progress;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  // Auto-fire 1.5s after ready
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(goNow, 1500);
    return () => clearTimeout(t);
  }, [ready]);

  function goNow() {
    if (done) return;
    setDone(true);
    // Redirect current tab to ad link — ad network then redirects to himanga.fun
    // Make sure you set himanga.fun as destination in your effectivegatecpm dashboard!
    window.location.href = AD_LINK;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0a0f1e;
          font-family: 'DM Sans', sans-serif;
        }

        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, 20px) scale(1.1); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(56,189,248,0.35); }
          50%       { box-shadow: 0 4px 30px rgba(56,189,248,0.6); }
        }

        .page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          background: #0a0f1e;
          color: #f1f5f9;
        }

        .blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          pointer-events: none;
          animation: drift 8s ease-in-out infinite alternate;
        }
        .blob1 { width: 400px; height: 400px; background: #38bdf8; top: -100px; left: -100px; animation-delay: 0s; }
        .blob2 { width: 350px; height: 350px; background: #818cf8; bottom: -80px; right: -80px; animation-delay: 2s; }
        .blob3 { width: 250px; height: 250px; background: #34d399; top: 40%; left: 50%; animation-delay: 4s; }

        .card {
          position: relative;
          background: #111827;
          border: 1px solid rgba(56,189,248,0.15);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          max-width: 420px;
          width: 100%;
          text-align: center;
          box-shadow: 0 0 60px rgba(56,189,248,0.07), 0 20px 40px rgba(0,0,0,0.4);
          animation: cardIn 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        .badge {
          display: inline-block;
          background: rgba(56,189,248,0.12);
          border: 1px solid rgba(56,189,248,0.3);
          color: #38bdf8;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.3rem 0.9rem;
          border-radius: 999px;
          margin-bottom: 1.4rem;
        }

        .title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.5rem, 5vw, 2rem);
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 0.75rem;
          background: linear-gradient(135deg, #f1f5f9 30%, #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          color: #64748b;
          font-size: 0.92rem;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .ring-wrap {
          position: relative;
          width: 110px;
          height: 110px;
          margin: 0 auto 2rem;
        }

        .ring { transform: rotate(-90deg); }

        .ring-number {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .ring-num {
          font-family: 'Syne', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1;
          background: linear-gradient(135deg, #38bdf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .ring-label {
          font-size: 0.65rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 2px;
        }

        .progress-wrap {
          height: 4px;
          background: rgba(255,255,255,0.06);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .progress-bar {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #38bdf8, #818cf8);
          transition: width 1s linear;
        }

        .btn {
          display: block;
          width: 100%;
          padding: 0.9rem 1.5rem;
          border-radius: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          transition: all 0.2s;
        }

        .btn-wait {
          background: rgba(255,255,255,0.05);
          color: #64748b;
          cursor: not-allowed;
          border: 1px solid rgba(255,255,255,0.07);
        }

        .btn-go {
          background: linear-gradient(135deg, #38bdf8, #818cf8);
          color: #0a0f1e;
          cursor: pointer;
          animation: pulse 2s ease-in-out infinite;
        }

        .btn-go:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(56,189,248,0.45);
        }

        .footer-note {
          margin-top: 1.2rem;
          font-size: 0.75rem;
          color: #64748b;
        }
      `}</style>

      <div className="page">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />

        <div className="card">
          <div className="badge">⚡ Smart Link</div>

          <h1 className="title">
            Your Link is<br />Ready!
          </h1>

          <p className="subtitle">
            Please wait a moment. This helps keep the content free on himanga.fun.
          </p>

          {/* Ring countdown */}
          <div className="ring-wrap">
            <svg className="ring" width="110" height="110" viewBox="0 0 110 110">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <circle
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="6"
                cx="55" cy="55" r="45"
              />
              <circle
                fill="none"
                stroke="url(#grad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                cx="55" cy="55" r="45"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="ring-number">
              <span className="ring-num">
                {ready ? "✓" : remaining}
              </span>
              {!ready && <small className="ring-label">secs</small>}
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-wrap">
            <div
              className="progress-bar"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          {/* Button */}
          <button
            className={ready ? "btn btn-go" : "btn btn-wait"}
            disabled={!ready || done}
            onClick={goNow}
          >
            {done ? "Opening..." : ready ? "🚀 Open himanga.fun" : "⏳ Please wait..."}
          </button>

          <p className="footer-note">
            {ready
              ? "Tap the button to continue →"
              : "himanga.fun will open automatically"}
          </p>
        </div>
      </div>
    </>
  );
}