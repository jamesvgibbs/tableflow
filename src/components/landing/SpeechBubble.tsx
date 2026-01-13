import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SpeechBubbleProps {
  children: ReactNode;
  direction?: "left" | "right" | "bottom";
  className?: string;
  delay?: number;
}

export const SpeechBubble = ({
  children,
  direction = "bottom",
  className = "",
  delay = 0,
}: SpeechBubbleProps) => {
  const tailStyles = {
    left: "left-6 -bottom-4 border-t-[20px] border-t-card border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent",
    right:
      "right-6 -bottom-4 border-t-[20px] border-t-card border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent",
    bottom:
      "left-1/2 -translate-x-1/2 -bottom-4 border-t-[20px] border-t-card border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.5,
        type: "spring",
        stiffness: 200,
      }}
      className={`relative bg-card rounded-3xl p-6 shadow-card border-4 border-primary/20 ${className}`}
    >
      {children}
      <div className={`absolute w-0 h-0 ${tailStyles[direction]}`} />
    </motion.div>
  );
};
