"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Loader2,
  Maximize2,
  Minimize2,
  Lock,
  Settings,
  RotateCcw,
  AlertCircle,
  BookmarkCheck,
} from "lucide-react";
import Link from "next/link";
import { ChaptersSidebar } from "@/components/chapters-sidebar";
import { Header } from "./header";
import { MobileCommentsOverlay } from "./mobile-comments-overlay";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";

interface MangaReaderProps {
  mangaId: string;
  mangaTitle: string;
  chapter: number;
  mangaSlug?: string;
  totalPanels?: number;
  previousChapter: number | null;
  nextChapter: number | null;
  totalChapters?: number;
}

// ── Panel skeleton ────────────────────────────────────────────────────────────
function PanelSkeleton({ index }: { index: number }) {
  return (
    <div
      className="relative overflow-hidden border border-cyan-500/20 bg-slate-800/50 animate-pulse"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="w-full bg-slate-800/60" style={{ aspectRatio: "3/4" }} />
      <div className="absolute bottom-2 right-2 bg-slate-900/60 px-2 py-1 rounded">
        <div className="h-3 w-16 bg-slate-700/60 rounded-full" />
      </div>
    </div>
  );
}

export function MangaReader({
  mangaId,
  mangaTitle,
  mangaSlug,
  chapter,
  totalPanels: providedTotalPanels,
  previousChapter,
  nextChapter,
  totalChapters = 1200,
}: MangaReaderProps) {
  const { user } = useAuth();
  const { addBookmark } = useBookmarks(user?.id || null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [displayedPanels, setDisplayedPanels] = useState<number[]>([]);
  const [currentVisiblePanel, setCurrentVisiblePanel] = useState(1);
  const [detectedTotalPanels, setDetectedTotalPanels] = useState<number | null>(
    providedTotalPanels || null
  );
  const [shouldScrollToPanel, setShouldScrollToPanel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingChapterInfo, setIsFetchingChapterInfo] = useState(!providedTotalPanels);
  const [isDetecting, setIsDetecting] = useState(!providedTotalPanels);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [bookmarkSaved, setBookmarkSaved] = useState(false);
  const [loadingPanels, setLoadingPanels] = useState<Set<number>>(new Set());
  const [loadedPanels, setLoadedPanels] = useState<Set<number>>(new Set());

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [panelWidth, setPanelWidth] = useState(80);
  const [scrollSpeed, setScrollSpeed] = useState(50);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasBookmarkedRef = useRef(false);
  const bookmarkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const panelUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const panelRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const imageObserverRef = useRef<IntersectionObserver | null>(null);

  const isLockedChapter = chapter > totalChapters;

  const getOptimizedPanelUrl = (panelNumber: number) => {
    const paddedChapter = String(chapter).padStart(3, "0");
    const paddedPanel = String(panelNumber).padStart(3, "0");
    return `/api/manga/image?manga=${mangaSlug}&chapter=${paddedChapter}&panel=${paddedPanel}`;
  };

  const handleImageLoadStart = (panelNumber: number) => {
    setLoadingPanels((prev) => new Set(prev).add(panelNumber));
  };

  const handleImageLoadComplete = (panelNumber: number) => {
    setLoadingPanels((prev) => {
      const newSet = new Set(prev);
      newSet.delete(panelNumber);
      return newSet;
    });
    setLoadedPanels((prev) => new Set(prev).add(panelNumber));
  };

  const handleImageLoadError = (panelNumber: number) => {
    setLoadingPanels((prev) => {
      const newSet = new Set(prev);
      newSet.delete(panelNumber);
      return newSet;
    });
  };

  useEffect(() => {
    if (isLockedChapter || displayedPanels.length === 0) return;

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        let mostVisibleEntry = null;
        let highestRatio = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > highestRatio) {
            highestRatio = entry.intersectionRatio;
            mostVisibleEntry = entry;
          }
        });
        if (mostVisibleEntry) {
          const panelNumber = Number(
            mostVisibleEntry.target.getAttribute("data-panel")
          );
          if (panelNumber && panelNumber !== currentVisiblePanel) {
            setCurrentVisiblePanel(panelNumber);
          }
        }
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: "-10% 0px -10% 0px",
      }
    );

    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (!img.src && img.dataset.src) img.src = img.dataset.src;
          }
        });
      },
      { rootMargin: "50% 0px", threshold: 0.1 }
    );

    imageObserverRef.current = imageObserver;

    Object.values(panelRefs.current).forEach((ref) => {
      if (ref) {
        visibilityObserver.observe(ref);
        const img = ref.querySelector("img[data-src]");
        if (img) imageObserver.observe(img);
      }
    });

    return () => {
      visibilityObserver.disconnect();
      imageObserver.disconnect();
    };
  }, [displayedPanels, isLockedChapter, currentVisiblePanel]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const panelParam = urlParams.get("panel");
      if (panelParam) {
        const panelNumber = parseInt(panelParam, 10);
        if (!isNaN(panelNumber) && panelNumber > 0) {
          setShouldScrollToPanel(panelNumber);
          setCurrentVisiblePanel(panelNumber);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!user || isLockedChapter || hasBookmarkedRef.current) return;
    bookmarkTimerRef.current = setTimeout(async () => {
      const success = await addBookmark(mangaId, chapter, currentVisiblePanel);
      if (success) {
        hasBookmarkedRef.current = true;
        setBookmarkSaved(true);
        setTimeout(() => setBookmarkSaved(false), 3000);
      }
    }, 20000);
    return () => {
      if (bookmarkTimerRef.current) clearTimeout(bookmarkTimerRef.current);
    };
  }, [user, chapter, mangaId, addBookmark, isLockedChapter, currentVisiblePanel]);

  useEffect(() => {
    if (!user || isLockedChapter || !hasBookmarkedRef.current) return;
    panelUpdateTimerRef.current = setInterval(() => {
      addBookmark(mangaId, chapter, currentVisiblePanel);
    }, 10000);
    return () => {
      if (panelUpdateTimerRef.current) clearInterval(panelUpdateTimerRef.current);
    };
  }, [user, chapter, mangaId, currentVisiblePanel, addBookmark, isLockedChapter]);

  useEffect(() => {
    if (!shouldScrollToPanel) return;
    const targetPanelElement = panelRefs.current[shouldScrollToPanel];
    if (isFetchingChapterInfo || isDetecting) return;
    if (!displayedPanels.includes(shouldScrollToPanel)) return;
    if (!targetPanelElement) {
      const retryTimeout = setTimeout(() => {
        const retryElement = panelRefs.current[shouldScrollToPanel];
        if (retryElement) {
          retryElement.scrollIntoView({ behavior: "smooth", block: "center" });
          setShouldScrollToPanel(null);
        }
      }, 1500);
      return () => clearTimeout(retryTimeout);
    }
    const scrollTimeout = setTimeout(() => {
      targetPanelElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setShouldScrollToPanel(null);
    }, 1000);
    return () => clearTimeout(scrollTimeout);
  }, [shouldScrollToPanel, displayedPanels, isFetchingChapterInfo, isDetecting]);

  const fetchChapterInfo = useCallback(async () => {
    if (isLockedChapter || !mangaSlug) return;
    setIsFetchingChapterInfo(true);
    setIsDetecting(true);
    setFetchError(null);
    setDetectionError(null);

    try {
      const response = await fetch(
        `/api/manga/chapter-info?manga=${mangaId}&chapter=${chapter}`
      );
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          const fallbackPanelCount = 100;
          setDetectedTotalPanels(fallbackPanelCount);
          const initialPanels = Array.from({ length: 3 }, (_, i) => i + 1);
          setLoadingPanels(new Set(initialPanels));
          setDisplayedPanels(initialPanels);
          const msg = `Chapter ${chapter} metadata not found. Attempting to load panels...`;
          setFetchError(msg);
          setDetectionError(msg);
        } else {
          throw new Error(data.error || "Failed to fetch chapter information");
        }
      } else {
        if (data.totalPanels && data.totalPanels > 0) {
          setDetectedTotalPanels(data.totalPanels);
          const initialPanels = Array.from({ length: 3 }, (_, i) => i + 1);
          setLoadingPanels(new Set(initialPanels));
          setDisplayedPanels(initialPanels);
          setFetchError(null);
          setDetectionError(null);
        } else {
          const errorMsg = "No panels found for this chapter.";
          setFetchError(errorMsg);
          setDetectionError(errorMsg);
        }
      }
    } catch (error) {
      const fallbackPanelCount = 100;
      setDetectedTotalPanels(fallbackPanelCount);
      const initialPanels = Array.from({ length: 3 }, (_, i) => i + 1);
      setLoadingPanels(new Set(initialPanels));
      setDisplayedPanels(initialPanels);
      setFetchError("Unable to load chapter metadata. Attempting to load panels...");
      setDetectionError("Unable to load chapter metadata. Attempting to load panels...");
    } finally {
      setIsFetchingChapterInfo(false);
      setIsDetecting(false);
    }
  }, [chapter, mangaId, mangaSlug, isLockedChapter, shouldScrollToPanel]);

  useEffect(() => {
    if (!providedTotalPanels && !isLockedChapter && mangaSlug) {
      fetchChapterInfo();
    } else if (providedTotalPanels) {
      const initialPanels = Array.from({ length: 3 }, (_, i) => i + 1);
      setLoadingPanels(new Set(initialPanels));
      setDisplayedPanels(initialPanels);
    }
  }, [fetchChapterInfo, providedTotalPanels, isLockedChapter, mangaSlug]);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPanelsToUse = detectedTotalPanels || providedTotalPanels || 0;

  // Batch of 3 with 300ms stagger to avoid rate limiting
  const loadMorePanels = useCallback(() => {
    if (isLoading || displayedPanels.length >= totalPanelsToUse || isLockedChapter) return;
    setIsLoading(true);
    setTimeout(() => {
      const currentLength = displayedPanels.length;
      const nextPanels: number[] = [];
      for (let i = 1; i <= 3 && currentLength + i <= totalPanelsToUse; i++) {
        nextPanels.push(currentLength + i);
      }
      if (nextPanels.length > 0) {
        setLoadingPanels((prev) => {
          const newSet = new Set(prev);
          nextPanels.forEach((p) => newSet.add(p));
          return newSet;
        });
        setDisplayedPanels((prev) => [...prev, ...nextPanels]);
      }
      setIsLoading(false);
    }, 300);
  }, [displayedPanels.length, totalPanelsToUse, isLoading, isLockedChapter]);

  useEffect(() => {
    if (isLockedChapter || isFetchingChapterInfo || isDetecting) return;
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const scrolledToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 1500;
      if (scrolledToBottom && !isLoading && displayedPanels.length < totalPanelsToUse) {
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
    totalPanelsToUse,
    isLockedChapter,
    isFetchingChapterInfo,
    isDetecting,
  ]);

  const smoothScroll = (direction: "up" | "down") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = (scrollSpeed / 50) * 800;
    container.scrollTo({
      top:
        direction === "down"
          ? container.scrollTop + scrollAmount
          : container.scrollTop - scrollAmount,
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
      document.documentElement.requestFullscreen().catch(() => setIsFullscreen(true));
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
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };
    document.addEventListener("mousemove", handleMouseMove);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) setShowControls(true);
  }, [isFullscreen]);

  const handlePreviousChapter = () => {
    if (previousChapter !== null)
      window.location.href = `/manga/${mangaId}/chapter/${previousChapter}`;
  };

  const handleNextChapter = () => {
    if (nextChapter !== null && nextChapter <= totalChapters) {
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

  const AdvancedControlsGrid = ({ cols }: { cols: string }) => (
    <div className={`grid ${cols} gap-4 md:gap-6`}>
      {[
        { label: "🌞 Brightness", value: brightness, setter: setBrightness, min: 50, max: 150 },
        { label: "🎨 Contrast", value: contrast, setter: setContrast, min: 50, max: 150 },
        { label: "💧 Saturation", value: saturation, setter: setSaturation, min: 0, max: 200 },
        { label: "🔍 Panel Width", value: panelWidth, setter: setPanelWidth, min: 50, max: 150 },
        { label: "⚡ Scroll Speed", value: scrollSpeed, setter: setScrollSpeed, min: 25, max: 100 },
      ].map(({ label, value, setter, min, max }) => (
        <div key={label} className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs md:text-sm font-medium text-slate-300">{label}</label>
            <span className="text-xs md:text-sm text-pink-400 font-mono">{value}%</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => setter(Number(e.target.value))}
            className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
          />
        </div>
      ))}
    </div>
  );

  const AdvancedControlsPanel = ({ zIndex, cols }: { zIndex: string; cols: string }) => (
    <>
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${zIndex} animate-in fade-in duration-300`}
        onClick={() => setShowAdvancedControls(false)}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-5xl animate-in zoom-in-95 duration-300"
        style={{ zIndex: parseInt(zIndex.replace("z-[", "").replace("]", "")) + 10 }}
      >
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
                  <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Reset
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
          <AdvancedControlsGrid cols={cols} />
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
      <Header />

      {bookmarkSaved && (
        <div className="fixed top-20 right-4 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-gradient-to-r from-cyan-500/90 to-cyan-600/90 backdrop-blur-xl border border-cyan-400/30 rounded-lg px-4 py-3 shadow-lg shadow-cyan-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <BookmarkCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Bookmark Saved</p>
              <p className="text-xs text-white/80">Chapter {chapter}</p>
            </div>
          </div>
        </div>
      )}

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

          {/* ── Normal controls bar ── */}
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
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFullscreenToggle}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400 px-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                      className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400 px-2"
                    >
                      <Settings
                        className={`w-4 h-4 transition-transform duration-300 ${
                          showAdvancedControls ? "rotate-90" : ""
                        }`}
                      />
                    </Button>
                    {hasChangedSettings && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowControls(false)}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400 px-2 lg:hidden"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showAdvancedControls && !isFullscreen && (
            <AdvancedControlsPanel
              zIndex="z-[45]"
              cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            />
          )}

          {/* ── Fullscreen controls bar ── */}
          {isFullscreen && (
            <div
              className={`absolute top-0 left-0 right-0 z-50 transition-all duration-300 ${
                showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
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
                      <p className="text-xs font-medium">
                        Ch {chapter}
                        {totalPanelsToUse > 0 && (
                          <span className="text-cyan-400 ml-1">({totalPanelsToUse})</span>
                        )}
                      </p>
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
                    {["/", "/library", "/trending"].map((href, i) => (
                      <Link
                        key={href}
                        href={href}
                        className="text-white/70 hover:text-pink-500 transition font-semibold"
                      >
                        {["Home", "Library", "Trending"][i]}
                      </Link>
                    ))}
                  </nav>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFullscreenToggle}
                      className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400 px-2"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                        className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400 px-2"
                      >
                        <Settings
                          className={`w-4 h-4 transition-transform duration-300 ${
                            showAdvancedControls ? "rotate-90" : ""
                          }`}
                        />
                      </Button>
                      {hasChangedSettings && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showAdvancedControls && isFullscreen && (
            <AdvancedControlsPanel
              zIndex="z-[55]"
              cols="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
            />
          )}

          <MobileCommentsOverlay
            mangaId={mangaId}
            isOpen={isCommentsOpen}
            onClose={() => setIsCommentsOpen(false)}
          />

          {/* ── Scroll container ── */}
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
              div::-webkit-scrollbar { width: 8px; }
              div::-webkit-scrollbar-track { background: transparent; }
              div::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.3); border-radius: 4px; }
              div::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.5); }
            `}</style>

            {/* ── Chapter info loading skeletons ── */}
            {(isFetchingChapterInfo || isDetecting) && (
              <div
                className="w-full space-y-0"
                style={{ maxWidth: `${(panelWidth / 100) * 64}rem` }}
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <PanelSkeleton key={i} index={i} />
                ))}
              </div>
            )}

            {/* ── Error state ── */}
            {(fetchError || detectionError) && !isFetchingChapterInfo && !isDetecting && (
              <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                <AlertCircle className="w-12 h-12 text-yellow-500" />
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-bold text-slate-200">Error Loading Chapter</h2>
                  <p className="text-slate-400">{fetchError || detectionError}</p>
                  <Button
                    onClick={fetchChapterInfo}
                    className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* ── Locked chapter ── */}
            {isLockedChapter ? (
              <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                  <Lock className="w-24 h-24 text-cyan-500/50" />
                  <div className="absolute inset-0 blur-xl bg-cyan-500/20 rounded-full" />
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
              !isFetchingChapterInfo &&
              !isDetecting &&
              displayedPanels.length > 0 && (
                <div
                  className="w-full space-y-0 transition-all duration-300"
                  style={{ maxWidth: `${(panelWidth / 100) * 64}rem` }}
                >
                  {displayedPanels.map((panelNumber) => (
                    <div
                      key={panelNumber}
                      ref={(el) => { panelRefs.current[panelNumber] = el; }}
                      data-panel={panelNumber}
                      className="relative group overflow-hidden shadow-2xl border border-cyan-500/20 hover:border-cyan-400 transition-all hover:shadow-lg hover:shadow-cyan-500/20"
                    >
                      {/* Per-panel skeleton while image loads */}
                      {loadingPanels.has(panelNumber) ? (
                        <div className="relative overflow-hidden border border-cyan-500/20 bg-slate-800/50 animate-pulse">
                          <div className="w-full aspect-[3/4] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="w-8 h-8 animate-spin text-cyan-400/60" />
                              <p className="text-xs text-slate-500">
                                Panel {panelNumber}
                              </p>
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded">
                            <div className="h-3 w-20 bg-slate-700/60 rounded-full" />
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={getOptimizedPanelUrl(panelNumber)}
                          alt={`Panel ${panelNumber}`}
                          width={800}
                          height={1200}
                          className="w-full h-auto"
                          style={{ width: "100%", height: "auto" }}
                          loading="lazy"
                          onLoadStart={() => handleImageLoadStart(panelNumber)}
                          onLoad={() => handleImageLoadComplete(panelNumber)}
                          onError={() => handleImageLoadError(panelNumber)}
                        />
                      )}
                      <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        Panel {panelNumber} / {totalPanelsToUse}
                        {loadingPanels.has(panelNumber) && " (Loading...)"}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                    </div>
                  )}

                  {displayedPanels.length >= totalPanelsToUse && totalPanelsToUse > 0 && (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-slate-400 text-sm">End of chapter</p>
                      {nextChapter && nextChapter <= totalChapters && (
                        <Button
                          onClick={handleNextChapter}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white hover:text-cyan-400 mb-10"
                        >
                          Continue to Chapter {nextChapter}
                        </Button>
                      )}
                      {nextChapter && nextChapter > totalChapters && (
                        <Button
                          disabled
                          className="bg-slate-700 text-slate-400 cursor-not-allowed"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Chapter {nextChapter} - Not Released Yet
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}