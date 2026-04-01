// ========== FOOTER COMPONENT ==========
import Link from "next/link";
import { BookOpen, Heart } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0a1a]">
      <div className="container mx-auto px-4 md:px-8 lg:px- py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-black text-lg mb-4">
              <Image
                src="/logo.png"
                alt="HiManga Logo"
                width={40}
                height={40}
              />

              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent text-xl md:text-2xl">
                H!Manga
              </span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Your favorite manga platform with a beautiful, modern interface
              designed for the ultimate viewing experience.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-white/60 hover:text-pink-500 transition"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/library"
                  className="text-white/60 hover:text-pink-500 transition"
                >
                  Library
                </Link>
              </li>
              <li>
                <Link
                  href="/trending"
                  className="text-white/60 hover:text-pink-500 transition"
                >
                  Trending
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold mb-4 text-white">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="https://buymeacoffee.com/luffysfan"
                  className="text-white/60 hover:text-pink-500 transition flex items-center gap-2"
                >
                  <Heart className="w-3 h-3" />
                  Donate
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-pink-500 transition"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-pink-500 transition"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold mb-4 text-white">Follow Us</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-pink-500 transition"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-pink-500 transition"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/60 hover:text-pink-500 transition"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-white/40">
            © 2025 HiManga. All rights reserved. Made with ❤️ for manga lovers.
          </p>
        </div>
      </div>
    </footer>
  );
}
