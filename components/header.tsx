// components/header.tsx
"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Share2,
  Newspaper,
  Users,
  Menu,
  X,
  Home,
  Library,
  TrendingUp,
} from "lucide-react";
import NotificationsPanel from "@/components/notifications-panel";
import { useState } from "react";
import Image from "next/image";
import { useAvatar } from "@/hooks/useAvatar";
import { getAvatarUrl } from "@/lib/avatar-utils";
import { usePathname } from "next/navigation";

export function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Load avatar with proper server sync
  // Default to 0 for new users (will show /0.png)
  const { avatarId } = useAvatar({
    serverAvatarId: user?.avatarId,
    fallbackAvatarId: 0,
  });

  const avatarUrl = getAvatarUrl(avatarId) || "/Profile_pic/0.png";

  const handleShare = async () => {
    const currentUrl = window.location.href;

    // Generate a better title and description based on the current page
    let title = "HiManga";
    let text = "Check out HiManga - Read manga together!";

    // Customize share text based on the current page
    if (pathname?.includes("/manga/")) {
      if (pathname?.includes("/chapter/")) {
        // Extract chapter info from URL if possible
        const chapterMatch = pathname.match(/\/chapter\/(\d+)/);
        const chapterNum = chapterMatch ? chapterMatch[1] : "";
        title = chapterNum
          ? `Chapter ${chapterNum} - HiManga`
          : "Reading on HiManga";
        text = chapterNum
          ? `Check out Chapter ${chapterNum} on HiManga!`
          : "Check out this manga on HiManga!";
      } else {
        title = "Manga on HiManga";
        text = "Check out this manga on HiManga!";
      }
    } else if (pathname === "/trending") {
      title = "Trending Manga - HiManga";
      text = "Check out trending manga on HiManga!";
    } else if (pathname === "/library") {
      title = "Manga Library - HiManga";
      text = "Browse the manga library on HiManga!";
    } else if (pathname === "/news") {
      title = "Manga News - HiManga";
      text = "Check out the latest manga news on HiManga!";
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: currentUrl,
        });
      } catch (err) {
        // User cancelled share or error occurred
        if (err instanceof Error && err.name !== "AbortError") {
          // Fallback to clipboard if share fails
          fallbackCopyToClipboard(currentUrl);
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      fallbackCopyToClipboard(currentUrl);
    }
  };

  const fallbackCopyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy link:", err);
      alert(
        "Failed to copy link. Please copy it manually from the address bar."
      );
    }
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <header className="border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="w-full px-3 sm:px-4 md:px-8 lg:px-10 py-2.5 sm:py-3 min-h-[73px] flex items-center">
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 font-black text-xl group z-50"
          >
            <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="HiManga Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent text-2xl md:text-3xl">
              H!Manga
            </span>
          </Link>

          {/* Desktop Navigation - Only on large screens (1024px+) */}
          <nav className="hidden xl:flex items-center gap-6 2xl:gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-white/70 hover:text-pink-500 transition-colors duration-300 font-semibold group"
            >
              <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              <span>Home</span>
            </Link>
            <Link
              href="/library"
              className="flex items-center gap-2 text-white/70 hover:text-pink-500 transition-colors duration-300 font-semibold group"
            >
              <Library className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              <span>Library</span>
            </Link>
            <Link
              href="/trending"
              className="flex items-center gap-2 text-white/70 hover:text-pink-500 transition-colors duration-300 font-semibold group"
            >
              <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              <span>Trending</span>
            </Link>
            <Link
              href="/news"
              className="flex items-center gap-2 text-white/70 hover:text-pink-500 transition-colors duration-300 font-semibold group"
            >
              <Newspaper className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              <span>News</span>
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Share Button - Desktop */}
            <button
              onClick={handleShare}
              className="hidden sm:flex items-center gap-2 text-white/70 hover:text-pink-500 transition-colors duration-300 px-3 py-2 rounded-full hover:bg-white/5 group"
              title="Share this page"
            >
              <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden xl:inline text-sm font-medium">
                Share
              </span>
            </button>

            {/* Notifications */}
            {user && <NotificationsPanel userId={user.id} />}

            {/* Desktop Auth Section - Only on extra large screens */}
            <div className="hidden xl:flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/profile" className="group">
                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-white/5 transition-all duration-300">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-pink-500/40 group-hover:ring-pink-500 transition-all duration-300 flex-shrink-0 group-hover:scale-110">
                        <Image
                          src={avatarUrl}
                          alt={user.username}
                          fill
                          sizes="40px"
                          className="object-cover bg-slate-800 rounded-full"
                          key={avatarId}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/20 group-hover:to-purple-500/20 transition-all duration-300" />
                      </div>
                      <span className="hidden lg:inline text-white font-semibold group-hover:text-pink-400 transition-colors duration-300">
                        {user.username}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 hover:text-pink-500 text-white transition-colors duration-300 px-4 py-2 rounded-full font-medium text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-white/5 hover:text-pink-500 text-white/70 rounded-full font-medium transition-all duration-300"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300 font-semibold px-5"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile/Tablet Menu Button - Shows on all devices below 1280px */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="xl:hidden text-white hover:text-pink-500 transition-colors duration-300 p-1.5 sm:p-2 z-50 hover:bg-white/5 rounded-lg"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Menu Overlay - Shows up to 1280px */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile/Tablet Menu Drawer - Shows up to 1280px */}
      <div
        className={`fixed top-[73px] right-0 w-full sm:w-96 md:w-[400px] h-[calc(100dvh-73px)] bg-[#0a0a1a]/95 backdrop-blur-xl border-l border-white/10 transform transition-transform duration-300 ease-in-out z-40 xl:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* User Section - Mobile/Tablet */}
          {user && (
            <div className="border-b border-white/10 p-4 sm:p-6">
              <Link
                href="/profile"
                className="flex items-center gap-4 group"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-pink-500/40 group-hover:ring-pink-500 transition-all duration-300 flex-shrink-0">
                  <Image
                    src={avatarUrl}
                    alt={user.username}
                    fill
                    sizes="56px"
                    className="object-cover bg-slate-800 rounded-full"
                    key={avatarId}
                  />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg group-hover:text-pink-400 transition-colors">
                    {user.username}
                  </p>
                  <p className="text-white/50 text-sm">View Profile</p>
                </div>
              </Link>
            </div>
          )}

          {/* Navigation Links - Mobile/Tablet */}
          <nav className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-4 text-white/70 hover:text-pink-500 hover:bg-white/5 transition-all duration-300 font-semibold px-4 py-3 rounded-xl"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link
              href="/library"
              className="flex items-center gap-4 text-white/70 hover:text-pink-500 hover:bg-white/5 transition-all duration-300 font-semibold px-4 py-3 rounded-xl"
              onClick={() => setIsMenuOpen(false)}
            >
              <Library className="w-5 h-5" />
              <span>Library</span>
            </Link>
            <Link
              href="/trending"
              className="flex items-center gap-4 text-white/70 hover:text-pink-500 hover:bg-white/5 transition-all duration-300 font-semibold px-4 py-3 rounded-xl"
              onClick={() => setIsMenuOpen(false)}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Trending</span>
            </Link>
            <Link
              href="/news"
              className="flex items-center gap-4 text-white/70 hover:text-pink-500 hover:bg-white/5 transition-all duration-300 font-semibold px-4 py-3 rounded-xl"
              onClick={() => setIsMenuOpen(false)}
            >
              <Newspaper className="w-5 h-5" />
              <span>News</span>
            </Link>

            {/* Share Button - Mobile/Tablet */}
            <button
              onClick={() => {
                handleShare();
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-4 text-white/70 hover:text-pink-500 hover:bg-white/5 transition-all duration-300 font-semibold px-4 py-3 rounded-xl w-full"
            >
              <Share2 className="w-5 h-5" />
              <span>Share Page</span>
            </button>
          </nav>

          {/* Auth Buttons - Mobile/Tablet */}
          <div className="border-t border-white/10 p-4 sm:p-6 space-y-3">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white hover:text-pink-500 transition-all duration-300 px-6 py-3 rounded-full font-semibold"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className="w-full hover:bg-white/5 hover:text-pink-500 text-white/70 rounded-full font-medium transition-all duration-300 py-6"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link
                  href="/auth/signup"
                  className="block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300 font-semibold py-6">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
