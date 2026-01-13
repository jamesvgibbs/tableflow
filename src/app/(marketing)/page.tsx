import { redirect } from "next/navigation";
import {
  Navbar,
  HeroSection,
  ProblemSection,
  HowItWorksSection,
  FeaturesSection,
  PricingSection,
  FAQSection,
  FinalCTASection,
  Footer,
} from "@/components/landing";

export default function Home() {
  // Set NEXT_PUBLIC_SHOW_LANDING=true to show the marketing page
  const showLanding = process.env.NEXT_PUBLIC_SHOW_LANDING === "true";

  if (!showLanding) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen film-grain">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
