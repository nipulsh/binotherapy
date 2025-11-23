/**
 * Loader Component
 * 
 * Tasteful loading state while GLB model loads.
 * Shows a shimmer effect with galaxy-themed colors.
 */

"use client";

import { motion } from "framer-motion";

export default function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a]">
      <div className="text-center space-y-4">
        <motion.div
          className="w-16 h-16 mx-auto rounded-full"
          style={{
            background: `linear-gradient(135deg, var(--galaxy-primary), var(--galaxy-accent))`,
            boxShadow: "0 0 40px rgba(107, 76, 255, 0.6)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.p
          className="text-white text-lg font-light"
          style={{ color: "var(--galaxy-accent)" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading galaxy...
        </motion.p>
      </div>
    </div>
  );
}

