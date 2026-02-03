"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const plans = [
  {
    id: "single",
    name: "Single Event",
    price: 49,
    description: "Perfect for a one-time event",
    features: [
      "1 event",
      "Unlimited guests",
      "Unlimited rounds",
      "All themes",
      "QR check-in",
      "Email campaigns",
    ],
    popular: false,
  },
  {
    id: "bundle_3",
    name: "3-Event Bundle",
    price: 129,
    pricePerEvent: 43,
    description: "Save $18 across three events",
    features: [
      "3 events",
      "Unlimited guests",
      "Unlimited rounds",
      "All themes",
      "QR check-in",
      "Email campaigns",
    ],
    popular: true,
  },
  {
    id: "annual",
    name: "Annual Unlimited",
    price: 249,
    description: "Best for frequent event planners",
    features: [
      "Unlimited events",
      "Unlimited guests",
      "Unlimited rounds",
      "All themes",
      "QR check-in",
      "Email campaigns",
      "Priority support",
    ],
    popular: false,
  },
];

export const PricingSection = () => {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    if (!isSignedIn) {
      // Redirect to sign in with return URL
      router.push(`/sign-in?redirect_url=${encodeURIComponent("/#pricing")}`);
      return;
    }

    setLoadingPlan(planId);
    try {
      const result = await createCheckout({ productType: planId });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      // Could show a toast here
    } finally {
      setLoadingPlan(null);
    }
  };

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

      <div className="container max-w-6xl mx-auto relative">
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
          <p className="text-xl text-primary font-bold mb-4">
            Here is what it costs. No tricks. 🐕
          </p>
          <p className="text-muted-foreground max-w-xl mx-auto">
            $49 per event. I want you to see that I am good at my job.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative bg-card border-3 rounded-3xl p-6 lg:p-8 shadow-card ${
                plan.popular
                  ? "border-primary shadow-elevated scale-105"
                  : "border-primary/20"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <div className="text-center mb-6">
                <h3 className="font-display text-xl mb-2 text-foreground">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="font-display text-4xl lg:text-5xl font-bold text-primary">
                    ${plan.price}
                  </span>
                  {plan.pricePerEvent && (
                    <span className="text-sm text-muted-foreground">
                      (${plan.pricePerEvent}/event)
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePurchase(plan.id)}
                disabled={loadingPlan !== null}
                variant={plan.popular ? "hero" : "outline"}
                size="lg"
                className="w-full"
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    {plan.popular && <Sparkles className="w-4 h-4 mr-2" />}
                    Get Started
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          All plans include a 30-day money-back guarantee. I am confident you
          will be satisfied. 🐕
        </motion.p>
      </div>
    </section>
  );
};
