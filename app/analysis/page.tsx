"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectorCharts } from "@/components/analysis/sector-charts";
import { Button } from "@/components/ui/button";
import { RefreshCw, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DomainPerformance {
  total_sessions: number;
  average_score: number;
  median_score: number;
  best_score: number;
  score_stddev: number;
  average_accuracy: number | null;
  total_playtime_seconds: number;
  last_played: string | null;
}

interface ProgressData {
  productivity: unknown[];
  fitness: unknown[];
  study: unknown[];
  game: unknown[];
  wellbeing: unknown[];
  screentime: unknown[];
  custom: unknown[];
  domains?: Record<string, DomainPerformance | null>;
}

export default function AnalysisPage() {
  const [data, setData] = useState<ProgressData>({
    productivity: [],
    fitness: [],
    study: [],
    game: [],
    wellbeing: [],
    screentime: [],
    custom: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch("/api/progress");

      if (!response.ok) {
        throw new Error("Failed to fetch progress data");
      }

      const result = await response.json();

      if (result.success) {
        setData({
          productivity: result.productivity || [],
          fitness: result.fitness || [],
          study: result.study || [],
          game: result.game || [],
          wellbeing: result.wellbeing || [],
          screentime: result.screentime || [],
          custom: result.custom || [],
          domains: result.domains || {},
        });
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      console.error("Error fetching progress:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      // Set empty arrays on error to ensure charts still render
      setData({
        productivity: [],
        fitness: [],
        study: [],
        game: [],
        wellbeing: [],
        screentime: [],
        custom: [],
        domains: {},
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: "#0a0a1a" }}
      >
        <div className="text-center space-y-4">
          <RefreshCw
            className="h-8 w-8 animate-spin mx-auto"
            style={{ color: "var(--galaxy-accent)" }}
          />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#0a0a1a" }}>
      {/* Subtle gradient overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(107, 76, 255, 0.1) 0%, rgba(10, 10, 26, 0.8) 70%, rgba(0, 0, 0, 0.95) 100%)",
        }}
      />

      <div className="container py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1
              className="text-3xl font-bold flex items-center gap-2"
              style={{ color: "var(--galaxy-primary)" }}
            >
              <BarChart3
                className="h-8 w-8"
                style={{ color: "var(--galaxy-accent)" }}
              />
              Progress Analysis
            </h1>
            <p className="mt-2 text-gray-400">
              Comprehensive view of your performance across all sectors
            </p>
          </div>
          <Button
            onClick={fetchData}
            disabled={refreshing}
            variant="outline"
            className="gap-2 bg-white/5 backdrop-blur-md border-white/10 hover:border-[var(--galaxy-accent)]/50 hover:bg-white/10 transition-all duration-300"
            style={{
              color: "var(--galaxy-accent)",
              boxShadow: "0 0 20px rgba(0, 212, 255, 0.1)",
            }}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Card className="bg-white/5 backdrop-blur-md border-red-500/50">
              <CardContent className="pt-6">
                <p className="text-sm text-red-400">
                  Error: {error}. Charts will display empty states.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Sector Charts */}
        <SectorCharts
          productivity={data.productivity}
          fitness={data.fitness}
          study={data.study}
          game={data.game}
          wellbeing={data.wellbeing}
          screentime={data.screentime}
          custom={data.custom}
          domains={data.domains}
        />
      </div>
    </div>
  );
}
