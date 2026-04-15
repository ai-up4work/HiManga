"use client";
import { Download, Check, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";

export default function PWAInstallButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    const handleInstalled = () => {
      setIsInstalled(true);
      setShowButton(false);
    };
    window.addEventListener("appinstalled", handleInstalled);

    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setShowButton(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert('1. Tap Share button (📤)\n2. Scroll down → "Add to Home Screen"');
    }
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-200 px-4 py-3 rounded-xl text-sm font-medium">
        <Check className="w-4 h-4" />
        <span>✅ Installed!</span>
      </div>
    );
  }

  // ✅ ALWAYS SHOW ON MOBILE + when ready
  const shouldShow = showButton || isIOS;
  
  if (!shouldShow) return null;

  return (
    <button
      onClick={handleInstall}
      className={`flex items-center gap-2 w-full justify-center py-3 px-4 rounded-xl font-semibold text-sm shadow-lg transition-all duration-300 border border-white/20 hover:border-white/40 backdrop-blur-md ${
        isIOS 
          ? 'bg-gradient-to-r from-blue-500/80 to-cyan-500/80 hover:from-blue-600 hover:to-cyan-600 text-white'
          : 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-700 hover:to-pink-700 text-white'
      } ${className || ""}`}
    >
      {isIOS ? (
        <>
          <Smartphone className="w-5 h-5" />
          <span>Add to Home Screen</span>
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          <span>Install HiManga</span>
        </>
      )}
    </button>
  );
}