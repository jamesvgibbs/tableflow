import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono, Inter_Tight } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/cookie-consent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://seatherder.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Seatherder - AI Event Seating Software | Automated Table Assignments",
    template: "%s | Seatherder",
  },
  description:
    "Automate event seating with AI-powered table assignments. Smart department mixing, multi-round rotations, QR check-in, and seating constraints. Perfect for conferences, weddings, and corporate events. $49/event.",
  keywords: [
    "event seating software",
    "table assignment",
    "automated seating",
    "conference seating",
    "wedding seating chart",
    "event check-in",
    "QR code check-in",
    "seating arrangement",
    "table seating app",
    "event planning software",
  ],
  authors: [{ name: "Seatherder" }],
  creator: "Seatherder",
  publisher: "Seatherder",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Seatherder",
    title: "Seatherder - AI Event Seating Software",
    description:
      "Automate table assignments with AI. Smart mixing, multi-round rotations, QR check-in. Seat your event in minutes, not hours.",
    // Image auto-generated from opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "Seatherder - AI Event Seating Software",
    description:
      "Automate table assignments with AI. Smart mixing, multi-round rotations, QR check-in. $49/event.",
    // Image auto-generated from opengraph-image.tsx
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Schema.org structured data
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Seatherder",
  description: "AI-powered event seating and table assignment software",
  url: baseUrl,
  logo: `${baseUrl}/logo.png`,
  sameAs: [],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Seatherder",
  description:
    "AI-powered event seating software with AI-powered table assignments, multi-round rotations, and QR check-in",
  url: baseUrl,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "49",
    priceCurrency: "USD",
    description: "Per event pricing",
  },
  featureList: [
    "AI-powered table assignments",
    "Multi-round seating rotations",
    "QR code guest check-in",
    "Seating constraints (pin, repel, attract)",
    "Department mixing algorithm",
    "Real-time round timer",
    "Email campaigns",
    "Drag-and-drop seating editor",
  ],
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Seatherder - AI Event Seating Software",
  description:
    "Automate table assignments with AI-powered seating. Smart department mixing, multi-round rotations, QR check-in.",
  url: baseUrl,
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "Seatherder",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does Seatherder know who to seat together?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You tell Seatherder the departments and any constraints. It uses an AI algorithm to mix departments, respect constraints like keeping certain people apart, and optimize for networking and engagement.",
      },
    },
    {
      "@type": "Question",
      name: "Can I change the seating after Seatherder makes it?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you can manually adjust any seating assignments using the drag-and-drop editor. Seatherder remembers your changes and respects them.",
      },
    },
    {
      "@type": "Question",
      name: "What if someone doesn't show up to my event?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Seatherder includes QR code check-in that tracks attendance in real-time. You'll know exactly who has arrived and who hasn't.",
      },
    },
    {
      "@type": "Question",
      name: "What types of events does Seatherder work for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Seatherder works for conferences, corporate events, team-building activities, weddings, galas, networking events, and any gathering where table seating matters.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexMono.variable} ${interTight.variable} antialiased`}
      >
        <ClerkProvider>
          <Providers>
            {children}
            <Toaster />
            <CookieConsent />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
