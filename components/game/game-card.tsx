"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  difficulty: "easy" | "medium" | "hard";
  bestScore?: number;
  totalPlays?: number;
}

const difficultyColors = {
  easy: {
    bg: "rgba(34, 197, 94, 0.2)",
    text: "rgb(34, 197, 94)",
    border: "rgba(34, 197, 94, 0.5)",
  },
  medium: {
    bg: "rgba(255, 184, 77, 0.2)",
    text: "rgb(255, 184, 77)",
    border: "rgba(255, 184, 77, 0.5)",
  },
  hard: {
    bg: "rgba(239, 68, 68, 0.2)",
    text: "rgb(239, 68, 68)",
    border: "rgba(239, 68, 68, 0.5)",
  },
};

export function GameCard({
  title,
  description,
  icon,
  href,
  difficulty,
  bestScore,
  totalPlays,
}: GameCardProps) {
  const diffColor = difficultyColors[difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card
        className="group h-full bg-white/5 backdrop-blur-md border-white/10 hover:border-[var(--galaxy-accent)]/50 transition-all duration-300 hover:bg-white/10 hover:shadow-2xl"
        style={{
          boxShadow: "0 0 20px rgba(0, 212, 255, 0.1)",
        }}
      >
        <CardHeader>
          <div className="flex items-start justify-between mb-3">
            <div className="text-5xl mb-2 filter drop-shadow-lg">{icon}</div>
            <Badge
              className="text-xs font-semibold px-3 py-1 border"
              style={{
                backgroundColor: diffColor.bg,
                color: diffColor.text,
                borderColor: diffColor.border,
              }}
            >
              {difficulty.toUpperCase()}
            </Badge>
          </div>
          <CardTitle className="text-xl font-bold text-gray-200 mb-2">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-400 text-sm">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(bestScore !== undefined || totalPlays !== undefined) && (
            <div className="space-y-2 text-sm pt-2 border-t border-white/10">
              {bestScore !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Best Score:</span>
                  <span
                    className="font-semibold"
                    style={{ color: "var(--galaxy-accent)" }}
                  >
                    {bestScore.toLocaleString()}
                  </span>
                </div>
              )}
              {totalPlays !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Plays:</span>
                  <span
                    className="font-semibold"
                    style={{ color: "var(--galaxy-secondary)" }}
                  >
                    {totalPlays}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            asChild
            className="w-full text-white border-0 transition-all duration-300"
            style={{
              background: `linear-gradient(to right, var(--galaxy-primary), var(--galaxy-secondary))`,
              boxShadow: "0 4px 15px rgba(107, 76, 255, 0.3)",
            }}
          >
            <Link
              href={href}
              className="flex items-center justify-center gap-2"
            >
              Play Now
              <span className="text-lg">→</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
