"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";

export const FinalCTASection = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent" />

      <div className="container max-w-3xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Success vs Failure framing */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Failure state */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-card/50 rounded-2xl p-6 border-2 border-muted text-left"
            >
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Without Seatherder
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span>😫</span>
                  <span>Hours in spreadsheets</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>😬</span>
                  <span>Same people at same tables</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>😰</span>
                  <span>Last-minute chaos</span>
                </li>
              </ul>
            </motion.div>

            {/* Success state */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-primary/5 rounded-2xl p-6 border-2 border-primary/30 text-left"
            >
              <p className="text-sm text-primary uppercase tracking-wide mb-2">
                With Seatherder
              </p>
              <ul className="space-y-2 text-foreground">
                <li className="flex items-start gap-2">
                  <span>✨</span>
                  <span>Seating done in minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🤝</span>
                  <span>Everyone meets someone new</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>😌</span>
                  <span>You focus on the event, not logistics</span>
                </li>
              </ul>
            </motion.div>
          </div>

          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6 text-foreground">
            Ready to try?
          </h2>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-3xl p-8 mb-8 border-4 border-primary/20 shadow-card"
          >
            <p className="text-lg text-muted-foreground mb-4">
              $49 per event. No subscription required.
            </p>

            <p className="text-xl font-display font-bold text-foreground flex items-center justify-center gap-2">
              I am ready when you are. 🐕
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <Button variant="hero" size="xxl" className="mb-4" asChild>
              <Link href="/sign-up">
                <Sparkles className="w-6 h-6" />
                Get Started
                <ArrowRight className="w-6 h-6" />
              </Link>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="text-muted-foreground flex items-center justify-center gap-2 text-sm"
          >
            Takes 2 minutes to set up. Then I do the work.
            <Heart className="w-4 h-4 text-primary" />
          </motion.p>

          {/* Signature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9 }}
            className="mt-12 flex flex-col items-center gap-2"
          >
            <span className="text-4xl">🐾</span>
            <p className="font-display text-lg text-foreground">— Seatherder</p>
            <p className="text-sm text-muted-foreground italic">
              (a good dog who seats events)
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
