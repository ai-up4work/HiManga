import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { TrendingSection } from "@/components/trending-section";
import { FeaturesSection } from "@/components/features-section";
import { Footer } from "@/components/footer";
import { WhatsAppBanner } from "@/components/WhatsAppBanner";
export default function Home() {
  return (
    <div className="min-h-screen bg-white/5 flex flex-col scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600">
      <Header />
      <main>
        <HeroSection />

        {/* High-intent placement: catches users right after the hero */}
        <WhatsAppBanner variant="hero" />

        <TrendingSection />
        <FeaturesSection />

        {/* Re-engagement placement: catches scrollers who didn't convert above */}
        <WhatsAppBanner variant="subtle" />
      </main>
      <Footer />
    </div>
  );
}