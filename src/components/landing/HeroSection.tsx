"use client";

import { motion } from "framer-motion";
import { ArrowDown, Sparkles } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SpeechBubble } from "./SpeechBubble";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-24">
      {/* Confetti background */}
      <div className="absolute inset-0 confetti-bg opacity-50" />

      {/* Bouncing badge */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
        className="absolute top-20 left-4 md:top-24 md:left-8 z-20"
      >
        <div className="bg-accent text-accent-foreground px-2 py-1 md:px-4 md:py-2 rounded-full font-bold text-xs md:text-sm shadow-card flex items-center gap-1 md:gap-2 -rotate-6">
          <span className="text-xs md:text-base">✨</span>
          <span>WOOF! LIVE NOW</span>
          <span className="text-xs md:text-base">✨</span>
        </div>
      </motion.div>

      <div className="container max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Dog Image - LEFT on desktop for visual balance */}
          <motion.div
            initial={{ opacity: 0, x: -50, rotate: -10 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative max-w-sm mx-auto">
              {/* Glowing circle behind dog */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/30 to-accent/30 rounded-full blur-3xl" />

              {/* The good boy */}
              <Image
                src="/hero-dog.png"
                alt="The goodest boy - a happy border collie ready to seat your conference"
                className="relative w-full h-auto drop-shadow-2xl"
                width={500}
                height={500}
              />

              {/* Static decorative elements around the dog */}
              {["💕", "🐾", "⭐"].map((emoji, i) => (
                <span
                  key={i}
                  className="absolute text-2xl opacity-80"
                  style={{
                    top: `${20 + i * 25}%`,
                    right: i % 2 === 0 ? "-10%" : "auto",
                    left: i % 2 === 1 ? "-5%" : "auto",
                    transform: `rotate(${(i - 1) * 15}deg)`,
                  }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Text Content in Speech Bubble */}
          <div className="order-1 lg:order-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <SpeechBubble direction="left" className="mb-6">
                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl leading-tight mb-4 text-foreground">
                  <span className="text-primary">*ahem*</span>
                  <br />I am a border collie.
                  <br />
                  <span className="bg-linear-to-r from-primary via-pink-500 to-accent bg-clip-text text-transparent">
                    I will seat your conference.
                  </span>
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  This is my documentary. It is about me and the problem I have
                  solved. The problem is:{" "}
                  <strong className="text-foreground">seating.</strong>
                  <br />
                  The solution is:{" "}
                  <strong className="text-primary">also me.</strong> 🐕
                </p>
              </SpeechBubble>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button variant="hero" size="xl">
                <Sparkles className="w-5 h-5" />
                Let Me Help You
                <span className="text-xl">🐾</span>
              </Button>
              <Button
                variant="outline"
                size="xl"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Watch how I work
                <ArrowDown className="w-5 h-5" />
              </Button>
            </motion.div>

            {/* Fun stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4"
            >
              {[
                { num: "10,000+", label: "humans seated", emoji: "👥" },
                { num: "500+", label: "events herded", emoji: "🎪" },
                { num: "∞", label: "tail wags", emoji: "🐕" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.15, type: "spring" }}
                  className="bg-card/80 backdrop-blur rounded-2xl px-4 py-2 border-2 border-primary/20 shadow-soft"
                >
                  <div className="text-xl font-bold text-primary">
                    {stat.num} {stat.emoji}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 text-primary">
          <span className="text-sm font-bold">scroll for more!</span>
          <span className="text-2xl">🐾</span>
        </div>
      </div>
    </section>
  );
};
