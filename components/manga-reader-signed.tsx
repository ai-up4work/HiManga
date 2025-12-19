"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Menu,
  X,
  Loader2,
  Maximize2,
  Minimize2,
  Lock,
  Settings,
  RotateCcw,
  MessageCircle,
  Send,
  Heart,
  Reply,
} from "lucide-react";
import Link from "next/link";
import { ChaptersSidebar } from "@/components/chapters-sidebar";
import { Header } from "./header";
import { WATERMARK_CONFIG } from "@/lib/config";
import { mockComments } from "@/lib/mock-comments";
import { MobileCommentsOverlay } from "./mobile-comments-overlay";
import Image from "next/image";

interface MangaReaderProps {
  mangaId: string;
  mangaTitle: string;
  chapter: number;
  mangaSlug?: string;
  totalPanels: number;
  previousChapter: number | null;
  nextChapter: number | null;
  totalChapters?: number;
}

export function MangaReader({
  mangaId,
  mangaTitle,
  mangaSlug,
  chapter,
  totalPanels,
  previousChapter,
  nextChapter,
  totalChapters = 1200,
}: MangaReaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [displayedPanels, setDisplayedPanels] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23,
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [panelWidth, setPanelWidth] = useState(80);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isLockedChapter = chapter > totalChapters;

  const getOptimizedPanelUrl = (panelNumber: number) => {
    const paddedChapter = String(chapter).padStart(3, "0");
    const paddedPanel = String(panelNumber).padStart(3, "0");

    // Use your API endpoint to generate signed URLs
    // This prevents direct access to Cloudinary images
    const apiUrl = `/api/manga/signed-url`;
    const params = new URLSearchParams({
      mangaSlug: mangaSlug || "",
      chapter: paddedChapter,
      panel: paddedPanel,
    });

    return `${apiUrl}?${params.toString()}`;
  };

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      setSidebarOpen(isDesktop);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadMorePanels = useCallback(() => {
    if (isLoading || displayedPanels.length >= totalPanels || isLockedChapter)
      return;

    setIsLoading(true);
    setTimeout(() => {
      const currentLength = displayedPanels.length;
      const nextPanels = [];
      const batchSize = 5;

      for (let i = 1; i <= batchSize && currentLength + i <= totalPanels; i++) {
        nextPanels.push(currentLength + i);
      }

      if (nextPanels.length > 0) {
        setDisplayedPanels((prev) => [...prev, ...nextPanels]);
      }
      setIsLoading(false);
    }, 200);
  }, [displayedPanels.length, totalPanels, isLoading, isLockedChapter]);

  useEffect(() => {
    if (isLockedChapter) return;

    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollThreshold = 1500;
      const scrolledToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        scrollThreshold;

      if (
        scrolledToBottom &&
        !isLoading &&
        displayedPanels.length < totalPanels
      ) {
        loadMorePanels();
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      handleScroll();
    }
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [
    loadMorePanels,
    isLoading,
    displayedPanels.length,
    totalPanels,
    isLockedChapter,
  ]);

  const smoothScroll = (direction: "up" | "down") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = (scrollSpeed / 50) * 800;
    const targetScroll =
      direction === "down"
        ? container.scrollTop + scrollAmount
        : container.scrollTop - scrollAmount;

    container.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        smoothScroll("down");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        smoothScroll("up");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [scrollSpeed]);

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        setIsFullscreen(true);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = () => {
      setShowControls(true);

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    document.addEventListener("mousemove", handleMouseMove);

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true);
    }
  }, [isFullscreen]);

  const handlePreviousChapter = () => {
    if (previousChapter !== null && previousChapter !== undefined) {
      window.location.href = `/manga/${mangaId}/chapter/${previousChapter}`;
    }
  };

  const handleNextChapter = () => {
    if (nextChapter !== null && nextChapter !== undefined) {
      if (nextChapter > totalChapters) {
        return;
      }
      window.location.href = `/manga/${mangaId}/chapter/${nextChapter}`;
    }
  };

  const resetAdvancedControls = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setPanelWidth(80);
    setScrollSpeed(50);
  };

  const hasChangedSettings =
    brightness !== 100 ||
    contrast !== 100 ||
    saturation !== 100 ||
    panelWidth !== 80 ||
    scrollSpeed !== 50;

  return (
    <div className="h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
      <div className="lg:hidden">
        <Header />
      </div>
      <div className="flex flex-1 relative overflow-hidden">
        {sidebarOpen && !isFullscreen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {sidebarOpen && !isFullscreen && (
          <aside className="fixed lg:relative left-0 top-0 bottom-0 w-72 border-r border-cyan-500/20 bg-gradient-to-r from-slate-900/95 to-slate-900/90 backdrop-blur-xl z-50 lg:z-30 flex-shrink-0 overflow-auto transition-transform duration-300">
            <div className="space-y-2">
              <div className="lg:hidden flex justify-end p-4 border-b border-cyan-500/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="text-slate-400 text-sm">
                <ChaptersSidebar
                  mangaId={mangaId}
                  currentChapter={chapter}
                  chapters={totalChapters}
                />
              </div>
            </div>
          </aside>
        )}

        <div
          className="flex-1 flex flex-col bg-gradient-to-b from-slate-900/50 to-slate-950 overflow-hidden relative"
          style={{
            filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
          }}
        >
          {!showControls && !isFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(true)}
              className="absolute top-4 right-4 z-50 bg-slate-900/80 hover:bg-slate-800/80 text-slate-200 hover:text-cyan-400"
            >
              <Menu className="w-4 h-4" />
            </Button>
          )}
          {showControls && !isFullscreen && (
            <div className="bg-gradient-to-r from-slate-900/80 to-slate-900/60 backdrop-blur-xl border-t border-cyan-500/20 p-4 flex-shrink-0 transition-all duration-300 relative z-40">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400"
                  >
                    <Menu className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousChapter}
                    disabled={previousChapter === null}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <Card className="px-3 py-2 text-center bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-cyan-500/20 text-slate-200">
                    <p className="text-xs font-medium">Ch {chapter}</p>
                  </Card>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextChapter}
                    disabled={
                      nextChapter === null ||
                      (nextChapter !== null && nextChapter > totalChapters)
                    }
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <nav className="hidden lg:flex items-center gap-8">
                  <Link
                    href="/"
                    className="text-white/70 hover:text-pink-500 transition font-semibold"
                  >
                    Home
                  </Link>
                  <Link
                    href="/library"
                    className="text-white/70 hover:text-pink-500 transition font-semibold"
                  >
                    Library
                  </Link>
                  <Link
                    href="/trending"
                    className="text-white/70 hover:text-pink-500 transition font-semibold"
                  >
                    Trending
                  </Link>
                </nav>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFullscreenToggle}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>

                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowAdvancedControls(!showAdvancedControls)
                      }
                      className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                    >
                      <Settings
                        className={`w-4 h-4 transition-transform duration-300 ${
                          showAdvancedControls ? "rotate-90" : ""
                        }`}
                      />
                    </Button>
                    {hasChangedSettings && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowControls(false)}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2 lg:hidden"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Controls Overlay - Non-Fullscreen */}
          {showAdvancedControls && !isFullscreen && (
            <>
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[45] animate-in fade-in duration-300"
                onClick={() => setShowAdvancedControls(false)}
              />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[50] w-[90vw] max-w-4xl animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-lg p-4 md:p-6 border border-pink-500/30 shadow-2xl shadow-pink-500/20 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text flex items-center gap-2">
                      <Settings className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
                      Advanced Controls
                    </h3>
                    <div className="flex items-center gap-2">
                      {hasChangedSettings && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetAdvancedControls}
                          className="h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm text-pink-400 hover:text-pink-300 hover:bg-pink-500/10"
                        >
                          <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Reset
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvancedControls(false)}
                        className="h-7 md:h-8 px-2 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          🌞 Brightness
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {brightness}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                        style={{
                          background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${
                            ((brightness - 50) / 100) * 100
                          }%, rgb(51, 65, 85) ${
                            ((brightness - 50) / 100) * 100
                          }%, rgb(51, 65, 85) 100%)`,
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          🎨 Contrast
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {contrast}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                        style={{
                          background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${
                            ((contrast - 50) / 100) * 100
                          }%, rgb(51, 65, 85) ${
                            ((contrast - 50) / 100) * 100
                          }%, rgb(51, 65, 85) 100%)`,
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          💧 Saturation
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {saturation}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                        style={{
                          background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${
                            (saturation / 200) * 100
                          }%, rgb(51, 65, 85) ${
                            (saturation / 200) * 100
                          }%, rgb(51, 65, 85) 100%)`,
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          🔍 Panel Width
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {panelWidth}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={panelWidth}
                        onChange={(e) => setPanelWidth(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                        style={{
                          background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${
                            ((panelWidth - 50) / 100) * 100
                          }%, rgb(51, 65, 85) ${
                            ((panelWidth - 50) / 100) * 100
                          }%, rgb(51, 65, 85) 100%)`,
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          ⚡ Scroll Speed
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {scrollSpeed}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="25"
                        max="100"
                        value={scrollSpeed}
                        onChange={(e) => setScrollSpeed(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                        style={{
                          background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${
                            ((scrollSpeed - 25) / 75) * 100
                          }%, rgb(51, 65, 85) ${
                            ((scrollSpeed - 25) / 75) * 100
                          }%, rgb(51, 65, 85) 100%)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {isFullscreen && (
            <div
              className={`absolute top-0 left-0 right-0 z-50 transition-all duration-300 ${
                showControls
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-full opacity-0"
              }`}
            >
              <div className="bg-gradient-to-r from-slate-900/95 to-slate-900/80 backdrop-blur-xl border-b border-cyan-500/20 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousChapter}
                      disabled={previousChapter === null}
                      className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <Card className="px-3 py-2 text-center bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-cyan-500/20 text-slate-200">
                      <p className="text-xs font-medium">Ch {chapter}</p>
                    </Card>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextChapter}
                      disabled={
                        nextChapter === null ||
                        (nextChapter !== null && nextChapter > totalChapters)
                      }
                      className="bg-slate-800/50 border-cyan-500/30 text-cyan-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <nav className="hidden lg:flex items-center gap-8">
                    <Link
                      href="/"
                      className="text-white/70 hover:text-pink-500 transition font-semibold"
                    >
                      Home
                    </Link>
                    <Link
                      href="/library"
                      className="text-white/70 hover:text-pink-500 transition font-semibold"
                    >
                      Library
                    </Link>
                    <Link
                      href="/trending"
                      className="text-white/70 hover:text-pink-500 transition font-semibold"
                    >
                      Trending
                    </Link>
                  </nav>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFullscreenToggle}
                      className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>

                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setShowAdvancedControls(!showAdvancedControls)
                        }
                        className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                      >
                        <Settings
                          className={`w-4 h-4 transition-transform duration-300 ${
                            showAdvancedControls ? "rotate-90" : ""
                          }`}
                        />
                      </Button>
                      {hasChangedSettings && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Controls Overlay - Fullscreen */}
          {showAdvancedControls && isFullscreen && (
            <>
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[55] animate-in fade-in duration-300"
                onClick={() => setShowAdvancedControls(false)}
              />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[90vw] max-w-5xl animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-lg p-4 md:p-6 border border-pink-500/30 shadow-2xl shadow-pink-500/20 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text flex items-center gap-2">
                      <Settings className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
                      Advanced Controls
                    </h3>
                    <div className="flex items-center gap-2">
                      {hasChangedSettings && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetAdvancedControls}
                          className="h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm text-pink-400 hover:text-pink-300 hover:bg-pink-500/10"
                        >
                          <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Reset
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvancedControls(false)}
                        className="h-7 md:h-8 px-2 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          🌞 Brightness
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {brightness}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                        style={{
                          background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${
                            ((brightness - 50) / 100) * 100
                          }%, rgb(51, 65, 85) ${
                            ((brightness - 50) / 100) * 100
                          }%, rgb(51, 65, 85) 100%)`,
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          🎨 Contrast
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {contrast}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                        style={{
                          background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${
                            ((contrast - 50) / 100) * 100
                          }%, rgb(51, 65, 85) ${
                            ((contrast - 50) / 100) * 100
                          }%, rgb(51, 65, 85) 100%)`,
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          💧 Saturation
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {saturation}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                        style={{
                          background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${
                            (saturation / 200) * 100
                          }%, rgb(51, 65, 85) ${
                            (saturation / 200) * 100
                          }%, rgb(51, 65, 85) 100%)`,
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          🔍 Panel Width
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {panelWidth}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={panelWidth}
                        onChange={(e) => setPanelWidth(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                        style={{
                          background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${
                            ((panelWidth - 50) / 100) * 100
                          }%, rgb(51, 65, 85) ${
                            ((panelWidth - 50) / 100) * 100
                          }%, rgb(51, 65, 85) 100%)`,
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          ⚡ Scroll Speed
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {scrollSpeed}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="25"
                        max="100"
                        value={scrollSpeed}
                        onChange={(e) => setScrollSpeed(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                        style={{
                          background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${
                            ((scrollSpeed - 25) / 75) * 100
                          }%, rgb(51, 65, 85) ${
                            ((scrollSpeed - 25) / 75) * 100
                          }%, rgb(51, 65, 85) 100%)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Minimal Comments Button - Centered */}
          <button
            onClick={() => setIsCommentsOpen(true)}
            className="absolute bottom-[2.5px] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1 bg-slate-800/90 border border-slate-700/50 hover:bg-slate-800 hover:border-cyan-400/40 text-slate-100 px-3 py-2 rounded-lg transition-all duration-200 group min-w-[60px]"
          >
            <ChevronUp className="w-4 h-4 text-cyan-400/60 group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-medium text-center">Comments</span>
          </button>

          {/* Comments Overlay */}
          <MobileCommentsOverlay
            mangaId={mangaId}
            isOpen={isCommentsOpen}
            onClose={() => setIsCommentsOpen(false)}
          />

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto flex flex-col items-center gap-4 p-4 scroll-smooth"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(6, 182, 212, 0.3) transparent",
              scrollBehavior: "smooth",
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 8px;
              }
              div::-webkit-scrollbar-track {
                background: transparent;
              }
              div::-webkit-scrollbar-thumb {
                background: rgba(6, 182, 212, 0.3);
                border-radius: 4px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: rgba(6, 182, 212, 0.5);
              }
            `}</style>

            {isLockedChapter ? (
              <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                  <Lock className="w-24 h-24 text-cyan-500/50" />
                  <div className="absolute inset-0 blur-xl bg-cyan-500/20 rounded-full"></div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-slate-200">
                    Chapter {chapter} Not Released Yet
                  </h2>
                  <p className="text-slate-400">
                    This chapter hasn't been released yet. Check back later!
                  </p>
                  <p className="text-sm text-slate-500">
                    Latest available chapter: {totalChapters}
                  </p>
                </div>
                <Button
                  onClick={() =>
                    (window.location.href = `/manga/${mangaId}/chapter/${totalChapters}`)
                  }
                  className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Go to Latest Chapter
                </Button>
              </div>
            ) : (
              <div
                className="w-full space-y-0 transition-all duration-300"
                style={{ maxWidth: `${(panelWidth / 100) * 64}rem` }}
              >
                {displayedPanels.map((panelNumber) => (
                  <div
                    key={panelNumber}
                    className="relative group overflow-hidden shadow-2xl border border-cyan-500/20 hover:border-cyan-400 transition-all hover:shadow-lg hover:shadow-cyan-500/20"
                  >
                    <Image
                      src={getOptimizedPanelUrl(panelNumber)}
                      alt={`Panel ${panelNumber}`}
                      className="w-full h-auto"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      Panel {panelNumber} / {totalPanels}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  </div>
                )}

                {displayedPanels.length >= totalPanels && (
                  <div className="text-center py-8 space-y-4">
                    <p className="text-slate-400 text-sm">End of chapter</p>
                    {nextChapter && nextChapter <= totalChapters && (
                      <Button
                        onClick={handleNextChapter}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white hover:text-cyan-400"
                      >
                        Continue to Chapter {nextChapter}
                      </Button>
                    )}
                    {nextChapter && nextChapter > totalChapters && (
                      <div className="space-y-2">
                        <Button
                          disabled
                          className="bg-slate-700 text-slate-400 cursor-not-allowed"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Chapter {nextChapter} - Not Released Yet
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
