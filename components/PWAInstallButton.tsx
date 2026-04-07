"use client";
import { Download, Check, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";

export default function PWAInstallButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
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
      alert('On iOS: Tap Share button → "Add to Home Screen"');
    }
  };

  if (isInstalled) {
    return (
      <div
        className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 px-2.5 py-1.5 rounded-full text-xs"
        aria-label="App installed"
      >
        <Check className="w-3 h-3" />
        <span>Installed</span>
      </div>
    );
  }

  if (!showButton && !isIOS) return null;

  return (
    <button
      onClick={handleInstall}
      className={`flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 border border-white/20 hover:border-white/30 ${
        className || ""
      }`}
    >
      {isIOS ? (
        <>
          <Smartphone className="w-3.5 h-3.5" />
          <span>Add to Home Screen</span>
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </>
      )}
    </button>
  );
}