import {
  CheckInSection,
  FAQSection,
  FeaturesSection,
  FinalCTASection,
  Footer,
  HeroSection,
  HowItWorksSection,
  Navbar,
  PricingSection,
  ProblemSection,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen film-grain">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <CheckInSection />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
