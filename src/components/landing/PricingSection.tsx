"use client";
import { motion } from "framer-motion";
import { Check, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { text: "Unlimited guests", emoji: "👥" },
  { text: "Unlimited rounds", emoji: "🔄" },
  { text: "All the themes", emoji: "🎨" },
  { text: "QR codes that work", emoji: "📱" },
  { text: "Me, thinking very hard", emoji: "🧠" },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 px-4 relative overflow-hidden">
      {/* Static floating treats */}
      {["🦴", "🐾", "💕", "⭐"].map((emoji, i) => (
        <span
          key={emoji}
          className="absolute text-3xl opacity-15"
          style={{
            left: `${10 + i * 25}%`,
            top: `${20 + (i % 2) * 40}%`,
            transform: `rotate(${i * 15 - 20}deg)`,
          }}
        >
          {emoji}
        </span>
      ))}

      <div className="container max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-2 text-foreground">
            I do not play games.
          </h2>
          <p className="text-xl text-primary font-bold">
            Here is what it costs. No tricks! 🐕
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotate: -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
          className="relative"
        >
          {/* Subtle background */}
          <div className="absolute -inset-8 bg-linear-to-r from-primary/10 via-accent/10 to-primary/10 rounded-4xl blur-2xl" />

          <div className="relative bg-card border-4 border-primary rounded-4xl p-8 md:p-12 shadow-elevated overflow-hidden">
            {/* Confetti pattern */}
            <div className="absolute inset-0 confetti-bg opacity-30" />

            <div className="relative text-center">
              <span className="inline-block bg-primary text-primary-foreground text-sm font-bold uppercase tracking-widest px-6 py-2 rounded-full mb-6 shadow-glow -rotate-2">
                ✨ The Only Plan ✨
              </span>

              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                One price. All features. No tiers named things like
                &ldquo;Professional&rdquo; or &ldquo;Enterprise.&rdquo; I do not
                know what those words mean. I know what{" "}
                <strong className="text-foreground">
                  &ldquo;seating&rdquo;
                </strong>{" "}
                means.
              </p>

              <div className="flex flex-col items-center mb-8">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-display text-6xl md:text-7xl font-bold bg-linear-to-r from-primary via-pink-500 to-accent bg-clip-text text-transparent">
                    $49
                  </span>
                  <span className="text-muted-foreground text-xl">
                    per event
                  </span>
                </div>
                <span className="text-sm text-success font-bold">
                  That is like 49 treats! 🦴
                </span>
              </div>

              <ul className="space-y-4 mb-10 max-w-sm mx-auto">
                {features.map((feature, index) => (
                  <motion.li
                    key={feature.text}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-4 text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-success" />
                    </div>
                    <span className="font-medium text-foreground">
                      {feature.text}
                    </span>
                    <span className="text-xl">{feature.emoji}</span>
                  </motion.li>
                ))}
              </ul>

              <Button variant="hero" size="xxl" className="mb-4">
                <Sparkles className="w-6 h-6" />
                Start Free
                <Heart className="w-6 h-6 text-white" />
              </Button>

              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                Your first event costs nothing. I want you to see that I am
                good.
                <span className="text-xl">🐕</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
