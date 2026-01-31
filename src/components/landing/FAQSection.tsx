"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do you know who to seat together?",
    answer:
      "You tell me the departments. I do not put the same department at the same table. You tell me who must be separated. I separate them. The rest is math. I am good at math. I am a computer who looks like a dog.",
  },
  {
    question: "What if someone doesn't show up?",
    answer:
      "I know. The QR code was not scanned. You will also know. We will both know together. This is called 'real-time check-in.' It is one of my capabilities.",
  },
  {
    question: "Can I change the seating after you make it?",
    answer:
      "Yes. I am not stubborn. You can move people. I will remember the change. We are collaborators.",
  },
  {
    question: "What if my event has weird requirements?",
    answer:
      "I like weird requirements. Tell me the rules. I will follow them. 'Do not seat anyone from Legal near the bar.' Fine. 'Table 1 is for people named Jennifer only.' Strange, but fine. I do not judge. I herd.",
  },
  {
    question: "Is this really just for conferences?",
    answer:
      "I work best at conferences. But I have also seated weddings, galas, and one very complicated bat mitzvah. I am versatile.",
  },
  {
    question: "What about the sheep incident?",
    answer: "I said we do not talk about that.",
  },
];
export const FAQSection = () => {
  return (
    <section className="py-24 px-4 bg-card relative overflow-hidden">
      {/* Playful background pattern */}
      <div className="absolute inset-0 paw-pattern opacity-30" />

      <div className="container max-w-3xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Questions I have been asked.
            <span className="text-primary"> Answers I have given.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            I am patient. I will explain. 🐕
          </p>
        </motion.div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <AccordionItem
                value={`item-${index}`}
                className="bg-background rounded-3xl border-3 border-primary/20 px-6 shadow-card hover:shadow-elevated transition-shadow duration-300 overflow-hidden"
              >
                <AccordionTrigger className="text-left font-display text-lg hover:no-underline py-6 group">
                  <span className="flex items-center gap-4">
                    <span className="w-10 h-10 bg-linear-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      🐾
                    </span>
                    <span className="text-foreground">{faq.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base pb-6 pl-14">
                  <div className="bg-secondary/30 rounded-2xl p-4 border border-primary/10">
                    {faq.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>

        {/* Decorative bone */}
        <div className="text-center mt-12">
          <span className="text-3xl">🦴</span>
        </div>
      </div>
    </section>
  );
};
