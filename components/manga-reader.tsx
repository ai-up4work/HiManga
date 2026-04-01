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
import { AdsterraAd } from "@/components/adsterra-ad";

// ── Single Adsterra zone ──────────────────────────────────────────────────────
const AD_ZONE = {
  scriptSrc:   "https://pl28844175.effectivegatecpm.com/5989d5793e1618d757df7f53effce21a/invoke.js",
  containerId: "container-5989d5793e1618d757df7f53effce21a",
};

// ── Smart link ────────────────────────────────────────────────────────────────
const SMART_LINK_URL = "https://www.effectivegatecpm.com/f5ivtgqp6?key=5c682aef3d3ca8ee57e0e9f4ffb5b1df";

// Which ad slot is currently active
type AdSlot = "loading" | "top-banner" | "end-of-chapter" | "none";

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

  // ── Ad slot state ─────────────────────────────────────────────────────────
  const [activeAdSlot, setActiveAdSlot] = useState<AdSlot>(
    providedTotalPanels ? "top-banner" : "loading"
  );
  const [adKey, setAdKey] = useState(0);
  const topBannerRef = useRef<HTMLDivElement>(null);
  const topBannerDismissedRef = useRef(false);

  // ── Smart link iframe ref ─────────────────────────────────────────────────
  const smartLinkFrameRef = useRef<HTMLIFrameElement | null>(null);

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

  // ── Transition between ad slots ───────────────────────────────────────────
  const switchAdSlot = useCallback((next: AdSlot) => {
    setActiveAdSlot("none");
    setTimeout(() => {
      setAdKey((k) => k + 1);
      setActiveAdSlot(next);
    }, 80);
  }, []);

  // ── When loading finishes → switch to top-banner ──────────────────────────
  useEffect(() => {
    if (!isFetchingChapterInfo && !isDetecting && displayedPanels.length > 0) {
      if (activeAdSlot === "loading") {
        switchAdSlot("top-banner");
        topBannerDismissedRef.current = false;
      }
    }
  }, [isFetchingChapterInfo, isDetecting, displayedPanels.length]);

  // ── Top banner scroll-away detection ─────────────────────────────────────
  useEffect(() => {
    if (activeAdSlot !== "top-banner") return;
    if (!topBannerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !topBannerDismissedRef.current) {
          topBannerDismissedRef.current = true;
          setActiveAdSlot("none");
          setAdKey((k) => k + 1);
        }
      },
      { threshold: 0, rootMargin: "0px" }
    );

    observer.observe(topBannerRef.current);
    return () => observer.disconnect();
  }, [activeAdSlot, topBannerRef.current]);

  // ── URL helpers ────────────────────────────────────────────────────────────
  const getOptimizedPanelUrl = (panelNumber: number) => {
    const chapterStr = Number.isInteger(chapter)
      ? String(chapter).padStart(3, "0")
      : String(chapter);
    const paddedPanel = String(panelNumber).padStart(3, "0");
    return `/api/manga/image?manga=${mangaSlug}&chapter=${chapterStr}&panel=${paddedPanel}`;
  };

  // ── Image load state ───────────────────────────────────────────────────────
  const handleImageLoadStart = (panelNumber: number) => {
    setLoadingPanels((prev) => new Set(prev).add(panelNumber));
  };

  const handleImageLoadComplete = (panelNumber: number) => {
    setLoadingPanels((prev) => {
      const s = new Set(prev); s.delete(panelNumber); return s;
    });
    setLoadedPanels((prev) => new Set(prev).add(panelNumber));
  };

  const handleImageLoadError = (panelNumber: number) => {
    setLoadingPanels((prev) => {
      const s = new Set(prev); s.delete(panelNumber); return s;
    });
  };

  // ── Intersection observers ─────────────────────────────────────────────────
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
          const panelNumber = Number(mostVisibleEntry.target.getAttribute("data-panel"));
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

  // ── Panel scroll-to from URL param ────────────────────────────────────────
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

  // ── Bookmark on read ───────────────────────────────────────────────────────
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
    return () => { if (bookmarkTimerRef.current) clearTimeout(bookmarkTimerRef.current); };
  }, [user, chapter, mangaId, addBookmark, isLockedChapter, currentVisiblePanel]);

  // ── Periodic bookmark progress update ────────────────────────────────────
  useEffect(() => {
    if (!user || isLockedChapter || !hasBookmarkedRef.current) return;
    panelUpdateTimerRef.current = setInterval(() => {
      addBookmark(mangaId, chapter, currentVisiblePanel);
    }, 10000);
    return () => { if (panelUpdateTimerRef.current) clearInterval(panelUpdateTimerRef.current); };
  }, [user, chapter, mangaId, currentVisiblePanel, addBookmark, isLockedChapter]);

  // ── Scroll to target panel once loaded ────────────────────────────────────
  useEffect(() => {
    if (!shouldScrollToPanel) return;
    if (isFetchingChapterInfo || isDetecting) return;
    if (!displayedPanels.includes(shouldScrollToPanel)) return;

    const targetPanelElement = panelRefs.current[shouldScrollToPanel];
    if (!targetPanelElement) {
      const t = setTimeout(() => {
        const el = panelRefs.current[shouldScrollToPanel];
        if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); setShouldScrollToPanel(null); }
      }, 1500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      targetPanelElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setShouldScrollToPanel(null);
    }, 1000);
    return () => clearTimeout(t);
  }, [shouldScrollToPanel, displayedPanels, isFetchingChapterInfo, isDetecting]);

  // ── Fetch chapter info ─────────────────────────────────────────────────────
  const fetchChapterInfo = useCallback(async () => {
    if (isLockedChapter || !mangaSlug) return;

    setIsFetchingChapterInfo(true);
    setIsDetecting(true);
    setFetchError(null);
    setDetectionError(null);

    try {
      const response = await fetch(`/api/manga/chapter-info?manga=${mangaId}&chapter=${chapter}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          const fallback = 100;
          setDetectedTotalPanels(fallback);
          const tp = shouldScrollToPanel || 10;
          setDisplayedPanels(Array.from({ length: Math.min(Math.max(15, tp + 10), fallback) }, (_, i) => i + 1));
          setFetchError(`Chapter ${chapter} metadata not found. Attempting to load panels...`);
          setDetectionError(`Chapter ${chapter} metadata not found. Attempting to load panels...`);
        } else {
          throw new Error(data.error || "Failed to fetch chapter information");
        }
      } else {
        if (data.totalPanels && data.totalPanels > 0) {
          setDetectedTotalPanels(data.totalPanels);
          const tp = shouldScrollToPanel || 10;
          setDisplayedPanels(Array.from({ length: Math.min(Math.max(15, tp + 10), data.totalPanels) }, (_, i) => i + 1));
          setFetchError(null);
          setDetectionError(null);
        } else {
          const msg = "No panels found for this chapter.";
          setFetchError(msg);
          setDetectionError(msg);
        }
      }
    } catch {
      const fallback = 100;
      setDetectedTotalPanels(fallback);
      const tp = shouldScrollToPanel || 10;
      setDisplayedPanels(Array.from({ length: Math.min(Math.max(15, tp + 10), fallback) }, (_, i) => i + 1));
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
      const tp = shouldScrollToPanel || 15;
      setDisplayedPanels(Array.from({ length: Math.min(Math.max(15, tp + 10), providedTotalPanels) }, (_, i) => i + 1));
    }
  }, [fetchChapterInfo, providedTotalPanels, isLockedChapter, shouldScrollToPanel, mangaSlug]);

  // ── Sidebar auto-open on desktop ───────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPanelsToUse = detectedTotalPanels || providedTotalPanels || 0;

  // ── Infinite scroll ────────────────────────────────────────────────────────
  const loadMorePanels = useCallback(() => {
    if (isLoading || displayedPanels.length >= totalPanelsToUse || isLockedChapter) return;
    setIsLoading(true);
    setTimeout(() => {
      const cur = displayedPanels.length;
      const next: number[] = [];
      for (let i = 1; i <= 5 && cur + i <= totalPanelsToUse; i++) next.push(cur + i);
      if (next.length > 0) setDisplayedPanels((prev) => [...prev, ...next]);
      setIsLoading(false);
    }, 200);
  }, [displayedPanels.length, totalPanelsToUse, isLoading, isLockedChapter]);

  useEffect(() => {
    if (isLockedChapter || isFetchingChapterInfo || isDetecting) return;
    const handleScroll = () => {
      const c = scrollContainerRef.current;
      if (!c) return;
      if (c.scrollHeight - c.scrollTop - c.clientHeight < 1500 && !isLoading && displayedPanels.length < totalPanelsToUse) {
        loadMorePanels();
      }
    };
    const c = scrollContainerRef.current;
    if (c) { c.addEventListener("scroll", handleScroll); handleScroll(); }
    return () => c?.removeEventListener("scroll", handleScroll);
  }, [loadMorePanels, isLoading, displayedPanels.length, totalPanelsToUse, isLockedChapter, isFetchingChapterInfo, isDetecting]);

  // ── Keyboard scroll ────────────────────────────────────────────────────────
  const smoothScroll = (direction: "up" | "down") => {
    const c = scrollContainerRef.current;
    if (!c) return;
    c.scrollTo({
      top: direction === "down" ? c.scrollTop + (scrollSpeed / 50) * 800 : c.scrollTop - (scrollSpeed / 50) * 800,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); smoothScroll("down"); }
      else if (e.key === "ArrowUp") { e.preventDefault(); smoothScroll("up"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [scrollSpeed]);

  // ── Fullscreen ─────────────────────────────────────────────────────────────
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
    const move = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };
    document.addEventListener("mousemove", move);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    return () => {
      document.removeEventListener("mousemove", move);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isFullscreen]);

  useEffect(() => { if (!isFullscreen) setShowControls(true); }, [isFullscreen]);

  // ── Chapter navigation (with silent iframe smart link) ────────────────────
  const navigateWithSmartLink = useCallback((destination: string) => {
    // Fire smart link in hidden iframe — no new tab, no focus steal, 100% invisible
    if (smartLinkFrameRef.current) {
      smartLinkFrameRef.current.src = SMART_LINK_URL;
    }
    // Navigate main tab immediately
    window.location.href = destination;
  }, []);

  const handlePreviousChapter = () => {
    if (previousChapter !== null && previousChapter !== undefined) {
      const dest = `/manga/${mangaId}/chapter/${formatChapterForUrl(previousChapter)}`;
      navigateWithSmartLink(dest);
    }
  };

  const handleNextChapter = () => {
    if (nextChapter !== null && nextChapter !== undefined) {
      if (nextChapter > totalChapters) return;
      const dest = `/manga/${mangaId}/chapter/${formatChapterForUrl(nextChapter)}`;
      navigateWithSmartLink(dest);
    }
  };

  // ── Advanced controls ──────────────────────────────────────────────────────
  const resetAdvancedControls = () => {
    setBrightness(100); setContrast(100); setSaturation(100);
    setPanelWidth(80); setScrollSpeed(50);
  };

  const hasChangedSettings =
    brightness !== 100 || contrast !== 100 || saturation !== 100 ||
    panelWidth !== 80 || scrollSpeed !== 50;

  // ── Panel placeholder ──────────────────────────────────────────────────────
  const PanelLoadingPlaceholder = ({ panelNumber }: { panelNumber: number }) => (
    <div className="relative group overflow-hidden shadow-2xl border border-cyan-500/20 bg-slate-800/50 animate-pulse">
      <div className="w-full aspect-[3/4] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <div className="text-center">
            <p className="text-sm text-slate-300 font-medium">Loading Panel {panelNumber}</p>
            <p className="text-xs text-slate-500 mt-1">Please wait...</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-xs text-slate-300">
        Loading...
      </div>
    </div>
  );

  // ── Shared ad props ────────────────────────────────────────────────────────
  const sharedAdProps = {
    scriptSrc:   AD_ZONE.scriptSrc,
    containerId: AD_ZONE.containerId,
    showLabel:   true,
    labelPosition: "top" as const,
    fullWidth:   true,
    centered:    true,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
      {!isFullscreen && <Header />}

      {/* Hidden smart link iframe — completely invisible, no tab opened, no focus change */}
      <iframe
        ref={smartLinkFrameRef}
        style={{ display: "none", width: 0, height: 0, border: "none", position: "absolute" }}
        title="bg"
      />

      {/* Bookmark saved toast */}
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

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && !isFullscreen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        {sidebarOpen && !isFullscreen && (
          <aside className="fixed lg:relative left-0 top-0 bottom-0 w-72 border-r border-cyan-500/20 bg-gradient-to-r from-slate-900/95 to-slate-900/90 backdrop-blur-xl z-50 lg:z-30 flex-shrink-0 overflow-auto transition-transform duration-300">
            <div className="space-y-2">
              <div className="lg:hidden flex justify-end p-4 border-b border-cyan-500/20">
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="text-slate-400 text-sm">
                <ChaptersSidebar mangaId={mangaId} currentChapter={chapter} chapters={totalChapters} />
              </div>
            </div>
          </aside>
        )}

        {/* Main content */}
        <div
          className="flex-1 flex flex-col bg-gradient-to-b from-slate-900/50 to-slate-950 overflow-hidden relative"
          style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }}
        >
          {!showControls && !isFullscreen && (
            <Button variant="ghost" size="sm" onClick={() => setShowControls(true)}
              className="absolute top-4 right-4 z-50 bg-slate-900/80 hover:bg-slate-800/80 text-slate-200 hover:text-cyan-400">
              <Menu className="w-4 h-4" />
            </Button>
          )}

          {/* Top controls bar */}
          {showControls && !isFullscreen && (
            <div className="bg-gradient-to-r from-slate-900/80 to-slate-900/60 backdrop-blur-xl border-t border-cyan-500/20 p-4 flex-shrink-0 transition-all duration-300 relative z-40">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400">
                    <Menu className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePreviousChapter} disabled={previousChapter === null}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Card className="px-3 py-2 text-center bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-cyan-500/20 text-slate-200">
                    <p className="text-xs font-medium">Ch {chapter}</p>
                  </Card>
                  <Button variant="outline" size="sm" onClick={handleNextChapter}
                    disabled={nextChapter === null || (nextChapter !== null && nextChapter > totalChapters)}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="hidden sm:flex flex-1 justify-center px-4 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate max-w-xs tracking-wide">{mangaTitle}</p>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={handleFullscreenToggle}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400 px-2">
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <div className="relative">
                    <Button variant="outline" size="sm" onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                      className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400 px-2">
                      <Settings className={`w-4 h-4 transition-transform duration-300 ${showAdvancedControls ? "rotate-90" : ""}`} />
                    </Button>
                    {hasChangedSettings && <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowControls(false)}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400 px-2 lg:hidden">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Advanced controls — non-fullscreen */}
          {showAdvancedControls && !isFullscreen && (
            <>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[45] animate-in fade-in duration-300" onClick={() => setShowAdvancedControls(false)} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[50] w-[90vw] max-w-4xl animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-lg p-4 md:p-6 border border-pink-500/30 shadow-2xl shadow-pink-500/20 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text flex items-center gap-2">
                      <Settings className="w-4 h-4 md:w-5 md:h-5 text-pink-400" /> Advanced Controls
                    </h3>
                    <div className="flex items-center gap-2">
                      {hasChangedSettings && (
                        <Button variant="ghost" size="sm" onClick={resetAdvancedControls}
                          className="h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm text-pink-400 hover:text-pink-300 hover:bg-pink-500/10">
                          <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Reset
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setShowAdvancedControls(false)}
                        className="h-7 md:h-8 px-2 text-slate-400 hover:text-slate-200">
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {[
                      { label: "🌞 Brightness", value: brightness, setter: setBrightness, min: 50, max: 150 },
                      { label: "🎨 Contrast",   value: contrast,   setter: setContrast,   min: 50, max: 150 },
                      { label: "💧 Saturation", value: saturation, setter: setSaturation, min: 0,  max: 200 },
                      { label: "🔍 Panel Width", value: panelWidth, setter: setPanelWidth, min: 50, max: 150 },
                      { label: "⚡ Scroll Speed", value: scrollSpeed, setter: setScrollSpeed, min: 25, max: 100 },
                    ].map(({ label, value, setter, min, max }) => (
                      <div key={label} className="space-y-2 md:space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs md:text-sm font-medium text-slate-300">{label}</label>
                          <span className="text-xs md:text-sm text-pink-400 font-mono">{value}%</span>
                        </div>
                        <input type="range" min={min} max={max} value={value}
                          onChange={(e) => setter(Number(e.target.value))}
                          className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Fullscreen top bar */}
          {isFullscreen && (
            <div className={`absolute top-0 left-0 right-0 z-50 transition-all duration-300 ${showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
              <div className="bg-gradient-to-r from-slate-900/95 to-slate-900/80 backdrop-blur-xl border-b border-cyan-500/20 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePreviousChapter} disabled={previousChapter === null}
                      className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Card className="px-3 py-2 text-center bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-cyan-500/20 text-slate-200">
                      <p className="text-xs font-medium">
                        Ch {chapter}
                        {totalPanelsToUse > 0 && <span className="text-cyan-400 ml-1">({totalPanelsToUse})</span>}
                      </p>
                    </Card>
                    <Button variant="outline" size="sm" onClick={handleNextChapter}
                      disabled={nextChapter === null || (nextChapter !== null && nextChapter > totalChapters)}
                      className="bg-slate-800/50 border-cyan-500/30 text-cyan-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <nav className="hidden lg:flex items-center gap-8">
                    <Link href="/" className="text-white/70 hover:text-pink-500 transition font-semibold">Home</Link>
                    <Link href="/library" className="text-white/70 hover:text-pink-500 transition font-semibold">Library</Link>
                    <Link href="/trending" className="text-white/70 hover:text-pink-500 transition font-semibold">Trending</Link>
                  </nav>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={handleFullscreenToggle}
                      className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400 px-2">
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                    <div className="relative">
                      <Button variant="outline" size="sm" onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                        className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400 px-2">
                        <Settings className={`w-4 h-4 transition-transform duration-300 ${showAdvancedControls ? "rotate-90" : ""}`} />
                      </Button>
                      {hasChangedSettings && <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced controls — fullscreen */}
          {showAdvancedControls && isFullscreen && (
            <>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[55] animate-in fade-in duration-300" onClick={() => setShowAdvancedControls(false)} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[90vw] max-w-5xl animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-lg p-4 md:p-6 border border-pink-500/30 shadow-2xl shadow-pink-500/20 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text flex items-center gap-2">
                      <Settings className="w-4 h-4 md:w-5 md:h-5 text-pink-400" /> Advanced Controls
                    </h3>
                    <div className="flex items-center gap-2">
                      {hasChangedSettings && (
                        <Button variant="ghost" size="sm" onClick={resetAdvancedControls}
                          className="h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm text-pink-400 hover:text-pink-300 hover:bg-pink-500/10">
                          <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Reset
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setShowAdvancedControls(false)}
                        className="h-7 md:h-8 px-2 text-slate-400 hover:text-slate-200">
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                    {[
                      { label: "🌞 Brightness", value: brightness, setter: setBrightness, min: 50, max: 150 },
                      { label: "🎨 Contrast",   value: contrast,   setter: setContrast,   min: 50, max: 150 },
                      { label: "💧 Saturation", value: saturation, setter: setSaturation, min: 0,  max: 200 },
                      { label: "🔍 Panel Width", value: panelWidth, setter: setPanelWidth, min: 50, max: 150 },
                      { label: "⚡ Scroll Speed", value: scrollSpeed, setter: setScrollSpeed, min: 25, max: 100 },
                    ].map(({ label, value, setter, min, max }) => (
                      <div key={label} className="space-y-2 md:space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs md:text-sm font-medium text-slate-300">{label}</label>
                          <span className="text-xs md:text-sm text-pink-400 font-mono">{value}%</span>
                        </div>
                        <input type="range" min={min} max={max} value={value}
                          onChange={(e) => setter(Number(e.target.value))}
                          className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Scroll container ──────────────────────────────────────────────── */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto flex flex-col items-center gap-4 p-4 scroll-smooth"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(6, 182, 212, 0.3) transparent", scrollBehavior: "smooth" }}
          >
            <style jsx>{`
              div::-webkit-scrollbar { width: 8px; }
              div::-webkit-scrollbar-track { background: transparent; }
              div::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.3); border-radius: 4px; }
              div::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.5); }
              @keyframes loadingSlide {
                0%   { transform: translateX(-100%); }
                100% { transform: translateX(350%); }
              }
              @keyframes fadeInUp {
                0%   { opacity: 0; transform: translateY(12px); }
                100% { opacity: 1; transform: translateY(0); }
              }
              .panels-fadein { animation: fadeInUp 0.35s ease-out both; }
            `}</style>

            {/* ── SLOT 1: Loading screen ── */}
            {(isFetchingChapterInfo || isDetecting) && (
              <div className="w-full max-w-2xl flex flex-col items-center justify-center min-h-[70vh] gap-8 px-4 py-8">
                {activeAdSlot === "loading" && (
                  <div className="w-full">
                    <AdsterraAd
                      key={adKey}
                      {...sharedAdProps}
                      showBorder
                      padding="py-4"
                      background="bg-slate-900/60"
                    />
                  </div>
                )}
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="relative flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full border-2 border-slate-700/60" />
                    <Loader2 className="absolute w-14 h-14 text-cyan-500 animate-spin" />
                    <div className="absolute w-3 h-3 rounded-full bg-cyan-400/80" />
                  </div>
                  <div className="w-full max-w-xs flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Chapter {chapter}</span>
                      <span className="text-cyan-500 animate-pulse tracking-wide">Loading…</span>
                    </div>
                    <div className="h-[3px] w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full w-[38%] rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                        style={{ animation: "loadingSlide 1.4s ease-in-out infinite" }}
                      />
                    </div>
                    <p className="text-xs text-slate-600 text-center mt-1">Fetching panel data from database</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Error state ── */}
            {(fetchError || detectionError) && !isFetchingChapterInfo && !isDetecting && (
              <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                <AlertCircle className="w-12 h-12 text-yellow-500" />
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-bold text-slate-200">Error Loading Chapter</h2>
                  <p className="text-slate-400">{fetchError || detectionError}</p>
                  <Button onClick={fetchChapterInfo} className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white">Retry</Button>
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
                  <h2 className="text-2xl font-bold text-slate-200">Chapter {chapter} Not Released Yet</h2>
                  <p className="text-slate-400">This chapter hasn't been released yet. Check back later!</p>
                  <p className="text-sm text-slate-500">Latest available chapter: {totalChapters}</p>
                </div>
                <Button onClick={() => (window.location.href = `/manga/${mangaId}/chapter/${totalChapters}`)}
                  className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white">
                  Go to Latest Chapter
                </Button>
              </div>
            ) : (
              !isFetchingChapterInfo && !isDetecting && displayedPanels.length > 0 && (
                <div
                  className="w-full space-y-0 transition-all duration-300 panels-fadein"
                  style={{ maxWidth: `${(panelWidth / 100) * 64}rem` }}
                >
                  {/* ── SLOT 2: Top-of-chapter banner ── */}
                  {activeAdSlot === "top-banner" && (
                    <div ref={topBannerRef} className="mb-2">
                      <AdsterraAd
                        key={adKey}
                        {...sharedAdProps}
                        showBorder={false}
                        padding="py-3"
                        background="bg-slate-900/40"
                      />
                    </div>
                  )}

                  {/* ── Panel list ── */}
                  {displayedPanels.map((panelNumber) => (
                    <div
                      key={panelNumber}
                      ref={(el) => { panelRefs.current[panelNumber] = el; }}
                      data-panel={panelNumber}
                      className="relative group overflow-hidden shadow-2xl border border-cyan-500/20 hover:border-cyan-400 transition-all hover:shadow-lg hover:shadow-cyan-500/20"
                    >
                      {loadingPanels.has(panelNumber) ? (
                        <PanelLoadingPlaceholder panelNumber={panelNumber} />
                      ) : (
                        <img
                          src={getOptimizedPanelUrl(panelNumber)}
                          alt={`Panel ${panelNumber}`}
                          width={800}
                          height={1200}
                          className="w-full h-auto"
                          loading="lazy"
                          data-src={getOptimizedPanelUrl(panelNumber)}
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

                  {/* Batch-load spinner */}
                  {isLoading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                    </div>
                  )}

                  {/* ── End of chapter ── */}
                  {displayedPanels.length >= totalPanelsToUse && totalPanelsToUse > 0 && (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-slate-400 text-sm">End of chapter</p>

                      {activeAdSlot !== "end-of-chapter" && activeAdSlot !== "none" && (
                        (() => {
                          if (!topBannerDismissedRef.current || activeAdSlot === "top-banner") {
                            topBannerDismissedRef.current = true;
                            setTimeout(() => switchAdSlot("end-of-chapter"), 0);
                          }
                          return null;
                        })()
                      )}

                      {activeAdSlot === "end-of-chapter" && (
                        <AdsterraAd
                          key={adKey}
                          {...sharedAdProps}
                          showBorder
                          padding="py-6"
                          background="bg-slate-900/60"
                        />
                      )}

                      {nextChapter && nextChapter <= totalChapters && (
                        <Button onClick={handleNextChapter}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white hover:text-cyan-400 mb-10">
                          Continue to Chapter {nextChapter}
                        </Button>
                      )}
                      {nextChapter && nextChapter > totalChapters && (
                        <div className="space-y-2">
                          <Button disabled className="bg-slate-700 text-slate-400 cursor-not-allowed">
                            <Lock className="w-4 h-4 mr-2" />
                            Chapter {nextChapter} - Not Released Yet
                          </Button>
                        </div>
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

// ── Helper ─────────────────────────────────────────────────────────────────────
function formatChapterForUrl(num: number): string {
  if (Number.isInteger(num)) return String(num);
  return String(parseFloat(num.toFixed(2))).replace(".", "-");
}