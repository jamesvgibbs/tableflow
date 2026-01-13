import {
  Navbar,
  HeroSection,
  ProblemSection,
  HowItWorksSection,
  FeaturesSection,
  PricingSection,
  FAQSection,
  FinalCTASection,
  Footer
} from "@/components/landing"

export default function Home() {
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
  )
}
