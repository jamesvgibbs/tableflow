"use client";

import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  Palette,
  Repeat,
  ScanLine,
  Shuffle,
  Utensils,
} from "lucide-react";

const features = [
  {
    icon: Repeat,
    title: "Multi-Round Seating",
    description:
      "Your conference has three lunches? I will seat them three times. Different people each time. Maximum mixing. I do not get tired. I am software.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Shuffle,
    title: "Department Mixing",
    description:
      "Humans sit with humans they know. This is instinct. It is wrong. I put Marketing with Engineering. They will thank me later. Or they will not. But they will have networked.",
    gradient: "from-primary to-pink-500",
  },
  {
    icon: Palette,
    title: "Custom Themes",
    description:
      "Your event has a look. I will match it. Your QR codes will not look like a ransom note. This is called 'brand alignment.' I learned this term recently.",
    gradient: "from-orange-400 to-amber-400",
  },
  {
    icon: ScanLine,
    title: "QR Check-In",
    description:
      "Guests scan. I know they have arrived. No one has to ask 'have you seen David?' I know where David is. Table 7.",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    icon: Utensils,
    title: "Dietary Tracking",
    description:
      "I remember who cannot eat gluten. I seat them where their food will find them. A hungry human is a chaotic human.",
    gradient: "from-success to-teal-400",
  },
  {
    icon: FileSpreadsheet,
    title: "Export Everything",
    description:
      "You want a spreadsheet? I will give you a spreadsheet. You want a PDF? Also fine. I am flexible. That is the old way. We are done with the old way.",
    gradient: "from-rose-400 to-pink-500",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 px-4 bg-card/50">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-2 text-foreground">
            I have many capabilities.
          </h2>
          <p className="text-xl text-primary font-bold">
            Here are some. They are all good. 🐕
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1, type: "spring" }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative"
            >
              <div className="bg-background border-4 border-transparent hover:border-primary/20 rounded-3xl p-6 h-full shadow-soft hover:shadow-card transition-all duration-300">
                {/* Icon badge */}
                <div className="flex items-center gap-3 mb-4 group-hover:scale-105 transition-transform">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-linear-to-br ${feature.gradient} flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                </div>

                <h3 className="font-display text-xl mb-3 text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Fun disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground italic">
            * I also do belly rubs but that is a premium feature (jk it is free)
          </p>
        </motion.div>
      </div>
    </section>
  );
};
