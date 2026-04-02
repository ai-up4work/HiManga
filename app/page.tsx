import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { TrendingSection } from "@/components/trending-section";
import { FeaturesSection } from "@/components/features-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white/5 flex flex-col scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600">
      <Header />
      <main>
        <HeroSection />
        <TrendingSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}