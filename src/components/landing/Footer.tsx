"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import Link from "next/link";

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "mailto:hello@seatherder.com", label: "Contact" },
];

export const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t-4 border-primary/10 bg-card/50">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.div
            className="text-center md:text-left flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-3xl">🐕</span>
            <div>
              <span className="font-display text-lg font-bold bg-linear-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                Seatherder
              </span>
              <p className="text-sm text-muted-foreground">
                A very good seating solution. By a very good boy.
              </p>
            </div>
          </motion.div>

          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            {footerLinks.map((link, i) => (
              <motion.div
                key={link.label}
                whileHover={{ y: -2, scale: 1.05 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {link.href.startsWith("mailto:") ? (
                  <a
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Made with
            <Heart className="w-4 h-4 text-primary" />
            and 🦴 © 2025
          </p>
        </div>

        {/* Static paw prints */}
        <div className="flex justify-center gap-4 mt-8 text-2xl opacity-30">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i}>🐾</span>
          ))}
        </div>
      </div>
    </footer>
  );
};
