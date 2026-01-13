'use client'

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export const Navbar = () => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/10"
    >
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-xl font-bold text-foreground"
            >
              <span className="text-2xl">🐕</span>
              <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                Seatherder
              </span>
            </Link>
          </motion.div>

          <div className="hidden md:flex items-center gap-6">
            {[
              { href: "#how-it-works", label: "How It Works" },
              { href: "#features", label: "Features" },
              { href: "#pricing", label: "Pricing" },
            ].map((link) => (
              <motion.a
                key={link.href}
                href={link.href}
                className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors relative"
                whileHover={{ y: -2 }}
                onClick={(e) => {
                  e.preventDefault()
                  const element = document.querySelector(link.href)
                  element?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                {link.label}
              </motion.a>
            ))}
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="default" size="sm" className="font-bold" asChild>
              <Link href="/login">
                <Sparkles className="w-4 h-4" />
                Get Started
                <span>🐾</span>
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  )
}
