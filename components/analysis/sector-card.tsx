"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface SectorCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  stats?: React.ReactNode;
  insights?: string;
  isEmpty?: boolean;
}

export function SectorCard({
  title,
  icon: Icon,
  children,
  stats,
  insights,
  isEmpty = false,
}: SectorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full bg-white/5 backdrop-blur-md border-white/10 hover:border-[var(--galaxy-accent)]/50 transition-all duration-300 hover:bg-white/10 hover:shadow-2xl"
        style={{
          boxShadow: "0 0 20px rgba(0, 212, 255, 0.1)",
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2 text-gray-200">
            <Icon 
              className="h-5 w-5" 
              style={{ color: "var(--galaxy-accent)" }}
            />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Summary */}
          {stats && <div className="grid grid-cols-2 gap-4">{stats}</div>}

          {/* Chart */}
          <div className="relative">
            {children}
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
                <p className="text-sm text-gray-400 font-medium">
                  No data yet
                </p>
              </div>
            )}
          </div>

          {/* Insights */}
          {insights && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-sm text-gray-400 italic">{insights}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

