"use client";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 film-grain">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg"
      >
        {/* 404 number with film-style treatment */}
        <div className="relative mb-8">
          <span className="text-[10rem] md:text-[12rem] font-serif font-bold text-foreground/5 leading-none select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
              Scene Missing
            </span>
          </div>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl mb-6">
          I have lost this page.
        </h1>

        <p className="text-muted-foreground text-lg mb-4">
          This is very embarrassing. I do not lose things. I am a herding dog.
          But this page is not here. Perhaps it wandered off. I will find it.
        </p>

        <p className="text-muted-foreground text-lg mb-10">
          In the meantime, please go back to the home page. I am sorry. This is
          not like me.
        </p>

        <Button asChild variant="default" size="lg">
          <Link href="/" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
