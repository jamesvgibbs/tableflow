import "./landing.css"
import { Footer } from "@/components/footer"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="landing-page flex min-h-screen flex-col">
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  )
}
