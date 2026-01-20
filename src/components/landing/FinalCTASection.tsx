"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, ArrowRight } from "lucide-react";

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
          {/* Film clapper emoji */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6 text-foreground">
            This concludes my documentary.
          </h2>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-3xl p-8 mb-8 border-4 border-primary/20 shadow-card"
          >
            <p className="text-lg text-muted-foreground mb-4">
              If you are still reading, you are my kind of human.
              <span className="text-foreground font-bold">
                {" "}
                Organized. Curious. Tired of spreadsheets.
              </span>
            </p>

            <p className="text-lg text-muted-foreground mb-4">
              I would like to seat your conference. Your first event is free.
              <span className="text-primary font-bold">
                {" "}
                I will not let you down.
              </span>
            </p>

            <p className="text-xl font-display font-bold text-foreground flex items-center justify-center gap-2">
              Click the button. I am ready. 🐕
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <Button variant="hero" size="xxl" className="mb-4">
              <Sparkles className="w-6 h-6" />
              Start Your First Event Free
              <ArrowRight className="w-6 h-6" />
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="text-muted-foreground flex items-center justify-center gap-2 text-sm"
          >
            No credit card. No commitment. Just good seating.
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
            <p className="text-sm text-muted-foreground italic">(the dog)</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
