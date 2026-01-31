"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { SpeechBubble } from "./SpeechBubble";

export const ProblemSection = () => {
  const problems = [
    {
      text: "The engineers sat with the engineers. They did not make new friends.",
      emoji: "🤓",
    },
    { text: "Table 14 was entirely VPs. No one enjoyed this.", emoji: "😬" },
    {
      text: "Someone named Bob was seated near someone named Linda. I do not know what Bob did. But it was wrong.",
      emoji: "😳",
    },
  ];

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Wavy background */}
      <div className="absolute inset-0 bg-card/50" />

      <div className="container max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-2">
            I have studied the humans.
          </h2>
          <h3 className="font-display text-2xl md:text-3xl text-primary">
            They are struggling. 😔
          </h3>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <SpeechBubble className="bg-card">
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                For many years I watched from the fields. I saw event planners
                open spreadsheets at midnight. I saw them drag names into cells,
                one by one, like sheep who do not know they are lost. 🐑
              </p>
              <p className="text-lg font-bold text-foreground">
                I saw what happened at the conferences:
              </p>
            </SpeechBubble>

            <div className="space-y-4">
              {problems.map((problem, index) => (
                <motion.div
                  key={problem.text}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
                  whileHover={{ scale: 1.02, x: 8 }}
                  className="flex items-start gap-4 bg-card rounded-2xl p-4 border-2 border-primary/10 shadow-soft cursor-default"
                >
                  <span className="text-3xl shrink-0">{problem.emoji}</span>
                  <p className="text-foreground italic">{problem.text}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="bg-linear-to-r from-primary/10 to-accent/10 rounded-3xl p-6 border-2 border-primary/20"
            >
              <p className="text-xl font-bold text-foreground">
                The humans had no system. They had only hope.
                <span className="text-primary">
                  {" "}
                  Hope is not a seating strategy.
                </span>
              </p>
              <p className="text-lg text-muted-foreground mt-2">
                I know this. I am a herding dog. 🐕‍🦺
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
            className="relative"
          >
            <div className="relative">
              {/* Decorative frame */}
              <div className="absolute -inset-4 bg-linear-to-br from-primary/20 to-accent/20 rounded-3xl blur-xl" />
              <Image
                src="/problem-illustration.png"
                width={1000}
                height={1000}
                alt="Chaos vs Order - confused humans at tables while a wise dog observes"
                className="relative w-full h-auto rounded-3xl shadow-elevated border-4 border-card"
              />
            </div>

            {/* Floating annotation */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, type: "spring" }}
              className="absolute -bottom-4 -right-4 bg-accent text-accent-foreground px-4 py-2 rounded-full font-bold shadow-card"
            >
              this is me thinking 🤔
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
