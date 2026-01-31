"use client";

import { motion } from "framer-motion";
import { QrCode, Search, Smartphone } from "lucide-react";

const checkInMethods = [
  {
    icon: QrCode,
    title: "Scan Their Code",
    description:
      "I give each guest a QR code. They scan it. I show them their table. It takes two seconds. They do not need to ask anyone anything. This is good because humans do not like asking for directions.",
    color: "from-primary to-pink-400",
  },
  {
    icon: Search,
    title: "Search By Name",
    description:
      "Some humans lose things. Emails. QR codes. Their keys. It is fine. They can search their name on the check-in page. I will find them. I am good at finding things.",
    color: "from-blue-400 to-cyan-400",
  },
  {
    icon: Smartphone,
    title: "No App Required",
    description:
      "I do not make your guests download anything. No app. No account. Just a phone with a camera. I am considerate like that.",
    color: "from-success to-emerald-400",
  },
];

export const CheckInSection = () => {
  return (
    <section className="py-24 px-4 bg-card relative overflow-hidden">
      {/* Subtle paw pattern background */}
      <div className="absolute inset-0 paw-pattern opacity-20" />

      <div className="container max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-2 text-foreground">
            The day of the event.
          </h2>
          <p className="text-xl text-primary font-bold flex items-center justify-center gap-2">
            I guide your guests to their seats. They do not get lost.
            <span>🐾</span>
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {checkInMethods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                type: "spring",
              }}
            >
              <motion.div
                whileHover={{ y: -8, rotate: index === 1 ? -1 : 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-background border-4 border-primary/10 rounded-3xl p-8 h-full shadow-card hover:shadow-elevated transition-shadow"
              >
                {/* Icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-linear-to-br ${method.color} flex items-center justify-center shadow-soft`}
                  >
                    <method.icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                <h3 className="font-display text-2xl mb-3 text-foreground">
                  {method.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  {method.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* URL hint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-background rounded-full px-6 py-4 border-4 border-primary/20 shadow-soft">
            <span className="font-bold text-foreground">
              Your guests go to:
            </span>
            <code className="bg-secondary/50 px-4 py-2 rounded-full text-primary font-mono text-sm">
              seatherder.com/checkin
            </code>
            <span className="text-muted-foreground hidden sm:inline">
              (I handle the rest)
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
