"use client";

import { motion } from "framer-motion";
import { ArrowRight, Brain, QrCode, Sparkles, Upload } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload",
    subtitle: "give me the names!",
    description:
      "You give me the names. Departments. Dietary needs. Who should not sit near whom. I do not ask why. That is not my business. My business is seating.",
    color: "from-blue-400 to-cyan-400",
  },
  {
    icon: Brain,
    title: "I Think",
    subtitle: "*thinking noises*",
    description:
      "This is the part where I work. I consider all the factors. I mix the departments. I separate the rivals. I honor the vegetarians. It takes me seconds. It would take you hours. This is not a brag. It is a fact.",
    color: "from-primary to-pink-400",
  },
  {
    icon: QrCode,
    title: "Everyone Has a Seat",
    subtitle: "good boy achievement unlocked!",
    description:
      "I produce the chart. I generate the QR codes. Your guests scan. They sit. They meet someone new. You say 'good boy.' This is the system.",
    color: "from-success to-emerald-400",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 px-4 relative">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-2 text-foreground">
            My process is elegant.
          </h2>
          <p className="text-xl text-primary font-bold flex items-center justify-center gap-2">
            Scientists (me) have confirmed this.
            <span>🔬</span>
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2, type: "spring" }}
              className="relative"
            >
              {/* Step number bubble */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.3 + index * 0.2,
                  type: "spring",
                  stiffness: 200,
                }}
                className="absolute -top-6 -left-2 z-10"
              >
                <div
                  className={`w-14 h-14 rounded-full bg-linear-to-br ${step.color} text-white flex items-center justify-center font-display text-2xl font-bold shadow-soft`}
                >
                  {index + 1}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -8, rotate: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-card border-4 border-primary/10 rounded-3xl p-8 pt-10 h-full shadow-card hover:shadow-elevated transition-shadow"
              >
                {/* Icon with emoji */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-linear-to-br ${step.color} flex items-center justify-center shadow-soft`}
                  >
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                <h3 className="font-display text-2xl mb-1 text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-primary font-bold mb-4 italic">
                  {step.subtitle}
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>

              {/* Connecting dotted line */}
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + index * 0.2, duration: 0.5 }}
                  className="hidden md:block absolute top-1/2 -right-6 lg:-right-8 w-8 lg:w-12 origin-left"
                >
                  <span className="absolute -right-2 -top-3 text-xl">
                    <ArrowRight />
                  </span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Fun bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-2 bg-card rounded-full px-6 py-3 border-4 border-primary/20 shadow-soft">
            <Sparkles className="w-5 h-5 text-primary animate-sparkle" />
            <span className="font-bold text-foreground">
              Total time: about 3 seconds
            </span>
            <span className="text-muted-foreground">
              (I am fast because I care)
            </span>
            <span className="text-xl">⚡</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
