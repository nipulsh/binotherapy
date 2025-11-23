/**
 * Hero Component
 *
 * Main hero section with title, subtitle, and CTA buttons.
 * Uses Framer Motion for entrance animations and hover effects.
 */

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeroProps {
  isMobile?: boolean;
}

export default function Hero({ isMobile = false }: HeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <motion.section
      className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 sm:py-20 min-h-screen relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Subtle gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 relative z-10">
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-extrabold tracking-tight text-white drop-shadow-2xl px-2"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          style={{
            color: "var(--galaxy-primary)",
            textShadow:
              "0 0 40px rgba(107, 76, 255, 0.5), 0 0 80px rgba(107, 76, 255, 0.3)",
          }}
        >
          Visual Skills
          <br />
          <span
            className="bg-gradient-to-r from-[var(--galaxy-accent)] via-[var(--galaxy-secondary)] to-[var(--galaxy-highlight)] bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--galaxy-accent), var(--galaxy-secondary), var(--galaxy-highlight))",
            }}
          >
            Training Platform
          </span>
        </motion.h1>

        <motion.p
          className="mt-4 sm:mt-6 max-w-3xl mx-auto text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-300 font-light px-4"
          variants={itemVariants}
        >
          Interactive games designed to test, monitor, and enhance your visual
          capabilities through scientifically-backed exercises
        </motion.p>

        <motion.div
          className="mt-8 sm:mt-12 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-4"
          variants={itemVariants}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              asChild
              size={isMobile ? "default" : "lg"}
              className="w-full sm:w-auto text-white border-0 shadow-lg transition-all duration-300 focus:ring-2 focus:ring-[var(--galaxy-accent)] focus:ring-offset-2"
              style={{
                background: `linear-gradient(to right, var(--galaxy-primary), var(--galaxy-secondary))`,
                boxShadow: "0 10px 30px rgba(107, 76, 255, 0.4)",
              }}
              aria-label="Get started with visual skills training"
            >
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              asChild
              variant="outline"
              size={isMobile ? "default" : "lg"}
              className="w-full sm:w-auto text-black hover:text-white hover:bg-black backdrop-blur-sm transition-all duration-300 focus:ring-2 focus:ring-[var(--galaxy-accent)] focus:ring-offset-2"
              style={{
                borderColor: "var(--galaxy-accent)",
                borderWidth: "2px",
              }}
              aria-label="View analytics and performance metrics"
            >
              <Link href="/analysis">View Analytics</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
