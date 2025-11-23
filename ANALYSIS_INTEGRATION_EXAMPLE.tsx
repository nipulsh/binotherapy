/**
 * EXAMPLE: Analysis Page Integration
 *
 * This file demonstrates how to integrate the domain analysis system
 * into your Analysis page component.
 *
 * Copy/adapt this code into your actual Analysis page.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDomainAnalysis } from "@/hooks/useDomainAnalysis";
import { DOMAIN_INFO } from "@/lib/utils/domain-mapping";
import type { DomainKey } from "@/lib/types/game.types";

export default function AnalysisPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(() => {
    const now = Date.now();
    return {
      start: new Date(now - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      end: new Date(now).toISOString().split("T")[0],
    };
  });

  const { data, loading, error, fetchDomains, computeMetrics } =
    useDomainAnalysis({
      userId: user?.id || "",
      periodStart: period.start,
      periodEnd: period.end,
    });

  // Fetch domains on mount and when period changes
  useEffect(() => {
    if (user?.id) {
      fetchDomains();
    }
  }, [user?.id, period, fetchDomains]);

  // Auto-compute if no data exists
  useEffect(() => {
    if (data && user?.id) {
      const allNull = Object.values(data.domains).every((d) => d === null);
      if (allNull) {
        console.log("No metrics found, computing...");
        computeMetrics();
      }
    }
  }, [data, user?.id, computeMetrics]);

  const handleRecompute = async () => {
    await computeMetrics();
  };

  const handlePeriodChange = (days: number) => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    setPeriod({ start, end });
  };

  if (!user) {
    return <div className="p-8">Please log in to view your analysis.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent mb-4">
            Performance Analysis
          </h1>
          <p className="text-purple-200">
            Track your progress across all cognitive domains
          </p>
        </div>

        {/* Period Selector */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-500/30">
          <div className="flex gap-4 items-center flex-wrap">
            <span className="text-purple-200 font-bold">Time Period:</span>
            <button
              onClick={() => handlePeriodChange(7)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handlePeriodChange(30)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handlePeriodChange(90)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all"
            >
              Last 90 Days
            </button>
            <button
              onClick={handleRecompute}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold transition-all ml-auto"
            >
              🔄 Recompute Metrics
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="text-purple-200 mt-4">Loading analysis data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/60 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-200 font-bold">⚠️ Error: {error}</p>
          </div>
        )}

        {/* Domain Cards Grid */}
        {data && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(data.domains).map(([domainKey, metrics]) => {
              const domain = domainKey as DomainKey;
              const info = DOMAIN_INFO[domain];

              return (
                <div
                  key={domain}
                  className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-500/30 hover:border-purple-500/50 transition-all"
                  style={{ borderColor: info.color + "50" }}
                >
                  {/* Domain Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{info.icon}</span>
                    <div>
                      <h2 className="text-2xl font-black text-white">
                        {info.name}
                      </h2>
                      <p className="text-sm text-purple-300">
                        {info.description}
                      </p>
                    </div>
                  </div>

                  {/* Metrics */}
                  {metrics ? (
                    <div className="space-y-3">
                      <MetricRow
                        label="Total Sessions"
                        value={metrics.total_sessions}
                      />
                      <MetricRow
                        label="Average Score"
                        value={metrics.average_score.toFixed(1)}
                      />
                      <MetricRow
                        label="Best Score"
                        value={metrics.best_score}
                      />
                      <MetricRow
                        label="Score Std Dev"
                        value={metrics.score_stddev.toFixed(1)}
                      />
                      {metrics.average_accuracy && (
                        <MetricRow
                          label="Avg Accuracy"
                          value={`${metrics.average_accuracy.toFixed(1)}%`}
                        />
                      )}
                      <MetricRow
                        label="Total Playtime"
                        value={formatDuration(metrics.total_playtime_seconds)}
                      />
                      {metrics.last_played && (
                        <MetricRow
                          label="Last Played"
                          value={new Date(
                            metrics.last_played
                          ).toLocaleDateString()}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-purple-300 mb-2">
                        No data for this period
                      </p>
                      <p className="text-sm text-purple-400">
                        Play some {info.name.toLowerCase()} games to see your
                        stats!
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Period Info */}
        {data && (
          <div className="mt-6 text-center text-purple-300 text-sm">
            Showing data from {data.period_start} to {data.period_end}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-purple-200 font-medium">{label}:</span>
      <span className="text-white font-bold">{value}</span>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
