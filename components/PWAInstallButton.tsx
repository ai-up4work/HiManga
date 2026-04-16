"use client";
import { Download, Check, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";

export default function PWAInstallButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if already running as installed PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // iOS detection — proper check
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(navigator as any).standalone;
    setIsIOS(ios);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert('To install:\n1. Tap the Share button (📤) at the bottom\n2. Tap "Add to Home Screen"');
    }
  };

  // Don't render server-side or if already installed/running standalone
  if (!mounted || isStandalone || isInstalled) return null;

  // Only show if we have a prompt ready (Android/desktop) OR on iOS Safari
  if (!deferredPrompt && !isIOS) return null;

  return (
    <button
      onClick={handleInstall}
      className={`flex items-center gap-2 justify-center py-3 px-4 rounded-xl font-semibold text-sm shadow-lg transition-all duration-300 border border-white/20 hover:border-white/40 backdrop-blur-md ${
        isIOS
          ? "bg-gradient-to-r from-blue-500/80 to-cyan-500/80 hover:from-blue-600 hover:to-cyan-600 text-white"
          : "bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-700 hover:to-pink-700 text-white"
      } ${className || ""}`}
    >
      {isIOS ? (
        <>
          <Smartphone className="w-4 h-4" />
          <span>Add to Home Screen</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Install HiManga</span>
        </>
      )}
    </button>
  );
}