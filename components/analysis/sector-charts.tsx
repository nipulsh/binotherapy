"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { SectorCard } from "./sector-card";
import { ChartWrapper } from "./chart-wrapper";
import {
  Briefcase,
  Dumbbell,
  BookOpen,
  Gamepad2,
  Heart,
  Monitor,
  BarChart3,
} from "lucide-react";

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

interface SectorChartsProps {
  productivity: unknown[];
  fitness: unknown[];
  study: unknown[];
  game: unknown[];
  wellbeing: unknown[];
  screentime: unknown[];
  custom: unknown[];
  domains?: Record<string, DomainPerformance | null>;
}

export function SectorCharts({
  productivity,
  fitness,
  study,
  game,
  wellbeing,
  screentime,
  custom,
  domains,
}: SectorChartsProps) {
  // Helper to generate empty chart data
  const getEmptyData = (labels: string[]) => ({
    labels,
    datasets: [
      {
        label: "No Data",
        data: labels.map(() => 0),
        borderColor: "rgba(200, 200, 200, 0.3)",
        backgroundColor: "rgba(200, 200, 200, 0.1)",
        borderWidth: 1,
        fill: true,
      },
    ],
  });

  // Helper to get last 7 days labels
  const getLast7DaysLabels = () => {
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString("en-US", { weekday: "short" }));
    }
    return labels;
  };

  // 1. Productivity Chart
  const productivityLabels = getLast7DaysLabels();
  const productivityChartData =
    productivity.length > 0
      ? {
          labels: productivity
            .slice(0, 7)
            .reverse()
            .map((p: any) =>
              new Date(p.date).toLocaleDateString("en-US", {
                weekday: "short",
              })
            ),
          datasets: [
            {
              label: "Productivity Score",
              data: productivity
                .slice(0, 7)
                .reverse()
                .map((p: any) => p.productivity_score || 0),
              borderColor: "rgb(59, 130, 246)",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
            {
              label: "Tasks Completed",
              data: productivity
                .slice(0, 7)
                .reverse()
                .map((p: any) => p.tasks_completed || 0),
              borderColor: "rgb(34, 197, 94)",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        }
      : getEmptyData(productivityLabels);

  const productivityStats = (
    <>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-primary)" }}
        >
          {(productivity as any[]).length > 0
            ? Math.round(
                (productivity as any[]).reduce(
                  (sum: number, p: any) =>
                    sum + ((p as any).productivity_score || 0),
                  0
                ) / (productivity as any[]).length
              )
            : 0}
        </p>
        <p className="text-xs text-gray-400">Avg Score</p>
      </div>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-accent)" }}
        >
          {(productivity as any[]).reduce(
            (sum: number, p: any) => sum + (p.tasks_completed || 0),
            0
          )}
        </p>
        <p className="text-xs text-gray-400">Total Tasks</p>
      </div>
    </>
  );

  // 2. Fitness Chart
  const fitnessLabels = getLast7DaysLabels();
  const fitnessChartData =
    fitness.length > 0
      ? {
          labels: fitness
            .slice(0, 7)
            .reverse()
            .map((f: any) =>
              new Date(f.date).toLocaleDateString("en-US", {
                weekday: "short",
              })
            ),
          datasets: [
            {
              label: "Duration (min)",
              data: fitness
                .slice(0, 7)
                .reverse()
                .map((f: any) => f.duration_minutes || 0),
              backgroundColor: "rgba(239, 68, 68, 0.8)",
              borderColor: "rgb(239, 68, 68)",
              borderWidth: 1,
            },
          ],
        }
      : getEmptyData(fitnessLabels);

  const fitnessStats = (
    <>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-accent)" }}
        >
          {(fitness as any[]).reduce(
            (sum: number, f: any) => sum + (f.duration_minutes || 0),
            0
          )}
        </p>
        <p className="text-xs text-gray-400">Total Minutes</p>
      </div>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-secondary)" }}
        >
          {(fitness as any[]).reduce(
            (sum: number, f: any) => sum + (f.calories_burned || 0),
            0
          )}
        </p>
        <p className="text-xs text-gray-400">Calories</p>
      </div>
    </>
  );

  // 3. Study Chart
  const studyLabels = getLast7DaysLabels();
  const studyChartData =
    study.length > 0
      ? {
          labels: study
            .slice(0, 7)
            .reverse()
            .map((s: any) =>
              new Date(s.date).toLocaleDateString("en-US", {
                weekday: "short",
              })
            ),
          datasets: [
            {
              label: "Study Time (min)",
              data: study
                .slice(0, 7)
                .reverse()
                .map((s: any) => s.study_time_minutes || 0),
              borderColor: "rgb(168, 85, 247)",
              backgroundColor: "rgba(168, 85, 247, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        }
      : getEmptyData(studyLabels);

  const studyStats = (
    <>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-secondary)" }}
        >
          {Math.round(
            (study as any[]).reduce(
              (sum: number, s: any) => sum + (s.study_time_minutes || 0),
              0
            ) / 60
          )}
        </p>
        <p className="text-xs text-gray-400">Total Hours</p>
      </div>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-primary)" }}
        >
          {study.length > 0
            ? Math.round(
                (study as any[]).reduce(
                  (sum: number, s: any) => sum + (s.comprehension_score || 0),
                  0
                ) / (study as any[]).length
              )
            : 0}
          %
        </p>
        <p className="text-xs text-gray-400">Avg Comprehension</p>
      </div>
    </>
  );

  // 4. Game Performance Chart
  const gameLabels = game
    .slice(0, 7)
    .reverse()
    .map((g: any) =>
      new Date(g.played_at).toLocaleDateString("en-US", {
        weekday: "short",
      })
    );
  const gameChartData =
    game.length > 0
      ? {
          labels: gameLabels.length > 0 ? gameLabels : getLast7DaysLabels(),
          datasets: [
            {
              label: "Score",
              data: game
                .slice(0, 7)
                .reverse()
                .map((g: any) => g.score || 0),
              borderColor: "rgb(251, 146, 60)",
              backgroundColor: "rgba(251, 146, 60, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
            {
              label: "Accuracy %",
              data: game
                .slice(0, 7)
                .reverse()
                .map((g: any) => g.accuracy || 0),
              borderColor: "rgb(34, 197, 94)",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        }
      : getEmptyData(getLast7DaysLabels());

  // Calculate domain-specific game metrics
  const depthMetrics = domains?.["depth-perception"];
  const eyeHandMetrics = domains?.["eye-hand-coordination"];
  const pursuitMetrics = domains?.["pursuit-follow"];
  const saccadicMetrics = domains?.["saccadic-movement"];

  // Calculate total sessions across all domains
  const totalDomainSessions =
    (depthMetrics?.total_sessions || 0) +
    (eyeHandMetrics?.total_sessions || 0) +
    (pursuitMetrics?.total_sessions || 0) +
    (saccadicMetrics?.total_sessions || 0);

  // Calculate weighted average accuracy across all domains
  const totalAccuracyWeight =
    (depthMetrics?.average_accuracy || 0) *
      (depthMetrics?.total_sessions || 0) +
    (eyeHandMetrics?.average_accuracy || 0) *
      (eyeHandMetrics?.total_sessions || 0) +
    (pursuitMetrics?.average_accuracy || 0) *
      (pursuitMetrics?.total_sessions || 0) +
    (saccadicMetrics?.average_accuracy || 0) *
      (saccadicMetrics?.total_sessions || 0);

  const averageAccuracy =
    totalDomainSessions > 0
      ? Math.round(totalAccuracyWeight / totalDomainSessions)
      : 0;

  const gameStats = (
    <>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-highlight)" }}
        >
          {totalDomainSessions || game.length}
        </p>
        <p className="text-xs text-gray-400">Total Sessions</p>
      </div>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-accent)" }}
        >
          {averageAccuracy ||
            (game.length > 0
              ? Math.round(
                  (game as any[]).reduce(
                    (sum: number, g: any) => sum + (g.accuracy || 0),
                    0
                  ) / (game as any[]).length
                )
              : 0)}
          %
        </p>
        <p className="text-xs text-gray-400">Avg Accuracy</p>
      </div>
      {depthMetrics && depthMetrics.total_sessions > 0 && (
        <div className="text-center">
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--galaxy-primary)" }}
          >
            {Math.round(depthMetrics.average_score)}
          </p>
          <p className="text-xs text-gray-400">📦 Depth Perception</p>
        </div>
      )}
      {pursuitMetrics && pursuitMetrics.total_sessions > 0 && (
        <div className="text-center">
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--galaxy-secondary)" }}
          >
            {Math.round(pursuitMetrics.average_score)}
          </p>
          <p className="text-xs text-gray-400">🎯 Pursuit & Follow</p>
        </div>
      )}
      {saccadicMetrics && saccadicMetrics.total_sessions > 0 && (
        <div className="text-center">
          <p
            className="text-2xl font-bold"
            style={{ color: "rgb(168, 85, 247)" }}
          >
            {Math.round(saccadicMetrics.average_score)}
          </p>
          <p className="text-xs text-gray-400">⚡ Saccadic Movement</p>
        </div>
      )}
      {eyeHandMetrics && eyeHandMetrics.total_sessions > 0 && (
        <div className="text-center">
          <p
            className="text-2xl font-bold"
            style={{ color: "rgb(34, 197, 94)" }}
          >
            {Math.round(eyeHandMetrics.average_score)}
          </p>
          <p className="text-xs text-gray-400">🎮 Eye-Hand Coord</p>
        </div>
      )}
    </>
  );

  // 5. Wellbeing Chart
  const wellbeingLabels = getLast7DaysLabels();
  const wellbeingChartData =
    wellbeing.length > 0
      ? {
          labels: wellbeing
            .slice(0, 7)
            .reverse()
            .map((w: any) =>
              new Date(w.date).toLocaleDateString("en-US", {
                weekday: "short",
              })
            ),
          datasets: [
            {
              label: "Mood",
              data: wellbeing
                .slice(0, 7)
                .reverse()
                .map((w: any) => w.mood_score || 0),
              borderColor: "rgb(236, 72, 153)",
              backgroundColor: "rgba(236, 72, 153, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
            {
              label: "Energy",
              data: wellbeing
                .slice(0, 7)
                .reverse()
                .map((w: any) => w.energy_level || 0),
              borderColor: "rgb(34, 197, 94)",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        }
      : getEmptyData(wellbeingLabels);

  const wellbeingStats = (
    <>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-secondary)" }}
        >
          {wellbeing.length > 0
            ? (
                (wellbeing as any[]).reduce(
                  (sum: number, w: any) => sum + (w.mood_score || 0),
                  0
                ) / (wellbeing as any[]).length
              ).toFixed(1)
            : 0}
        </p>
        <p className="text-xs text-gray-400">Avg Mood</p>
      </div>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-primary)" }}
        >
          {wellbeing.length > 0
            ? (
                (wellbeing as any[]).reduce(
                  (sum: number, w: any) => sum + (w.sleep_hours || 0),
                  0
                ) / (wellbeing as any[]).length
              ).toFixed(1)
            : 0}
        </p>
        <p className="text-xs text-gray-400">Avg Sleep (hrs)</p>
      </div>
    </>
  );

  // 6. Screen Time Chart
  const screentimeLabels = getLast7DaysLabels();
  const screentimeChartData =
    screentime.length > 0
      ? {
          labels: screentime
            .slice(0, 7)
            .reverse()
            .map((s: any) =>
              new Date(s.date).toLocaleDateString("en-US", {
                weekday: "short",
              })
            ),
          datasets: [
            {
              label: "Total Minutes",
              data: screentime
                .slice(0, 7)
                .reverse()
                .map((s: any) => s.total_minutes || 0),
              backgroundColor: [
                "rgba(59, 130, 246, 0.8)",
                "rgba(34, 197, 94, 0.8)",
                "rgba(251, 146, 60, 0.8)",
                "rgba(236, 72, 153, 0.8)",
                "rgba(168, 85, 247, 0.8)",
                "rgba(239, 68, 68, 0.8)",
                "rgba(20, 184, 166, 0.8)",
              ],
              borderColor: [
                "rgb(59, 130, 246)",
                "rgb(34, 197, 94)",
                "rgb(251, 146, 60)",
                "rgb(236, 72, 153)",
                "rgb(168, 85, 247)",
                "rgb(239, 68, 68)",
                "rgb(20, 184, 166)",
              ],
              borderWidth: 1,
            },
          ],
        }
      : getEmptyData(screentimeLabels);

  const screentimeStats = (
    <>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-accent)" }}
        >
          {Math.round(
            (screentime as any[]).reduce(
              (sum: number, s: any) => sum + (s.total_minutes || 0),
              0
            ) / 60
          )}
        </p>
        <p className="text-xs text-gray-400">Total Hours</p>
      </div>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-highlight)" }}
        >
          {screentime.length > 0
            ? Math.round(
                (screentime as any[]).reduce(
                  (sum: number, s: any) => sum + (s.total_minutes || 0),
                  0
                ) / (screentime as any[]).length
              )
            : 0}
        </p>
        <p className="text-xs text-gray-400">Daily Avg (min)</p>
      </div>
    </>
  );

  // 7. Custom Metrics Chart
  const customLabels =
    custom.length > 0
      ? [...new Set((custom as any[]).map((c: any) => c.metric_name))].slice(
          0,
          7
        )
      : ["Metric 1", "Metric 2", "Metric 3"];
  const customChartData =
    custom.length > 0
      ? {
          labels: customLabels,
          datasets: [
            {
              label: "Values",
              data: customLabels.map((label) => {
                const metrics = (custom as any[]).filter(
                  (c: any) => c.metric_name === label
                );
                return metrics.length > 0
                  ? (metrics as any[]).reduce(
                      (sum: number, m: any) => sum + (m.metric_value || 0),
                      0
                    ) / (metrics as any[]).length
                  : 0;
              }),
              backgroundColor: "rgba(99, 102, 241, 0.8)",
              borderColor: "rgb(99, 102, 241)",
              borderWidth: 1,
            },
          ],
        }
      : getEmptyData(customLabels);

  const customStats = (
    <>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-primary)" }}
        >
          {custom.length}
        </p>
        <p className="text-xs text-gray-400">Metrics</p>
      </div>
      <div className="text-center">
        <p
          className="text-2xl font-bold"
          style={{ color: "var(--galaxy-secondary)" }}
        >
          {custom.length > 0
            ? [...new Set((custom as any[]).map((c: any) => c.metric_name))]
                .length
            : 0}
        </p>
        <p className="text-xs text-gray-400">Categories</p>
      </div>
    </>
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* 1. Productivity */}
      <SectorCard
        title="Productivity"
        icon={Briefcase}
        stats={productivityStats}
        isEmpty={productivity.length === 0}
        insights={
          productivity.length > 0
            ? "Keep up the great work! Your productivity is trending well."
            : undefined
        }
      >
        <ChartWrapper type="line" data={productivityChartData} height={200} />
      </SectorCard>

      {/* 2. Fitness */}
      <SectorCard
        title="Fitness & Training"
        icon={Dumbbell}
        stats={fitnessStats}
        isEmpty={fitness.length === 0}
      >
        <ChartWrapper type="bar" data={fitnessChartData} height={200} />
      </SectorCard>

      {/* 3. Study */}
      <SectorCard
        title="Learning & Study"
        icon={BookOpen}
        stats={studyStats}
        isEmpty={study.length === 0}
      >
        <ChartWrapper type="line" data={studyChartData} height={200} />
      </SectorCard>

      {/* 4. Game Performance */}
      <SectorCard
        title="Game Performance"
        icon={Gamepad2}
        stats={gameStats}
        isEmpty={game.length === 0}
      >
        <ChartWrapper type="line" data={gameChartData} height={200} />
      </SectorCard>

      {/* 5. Wellbeing */}
      <SectorCard
        title="Mental Wellbeing"
        icon={Heart}
        stats={wellbeingStats}
        isEmpty={wellbeing.length === 0}
      >
        <ChartWrapper type="line" data={wellbeingChartData} height={200} />
      </SectorCard>

      {/* 6. Screen Time */}
      <SectorCard
        title="Screen Time"
        icon={Monitor}
        stats={screentimeStats}
        isEmpty={screentime.length === 0}
      >
        <ChartWrapper type="bar" data={screentimeChartData} height={200} />
      </SectorCard>

      {/* 7. Custom Metrics */}
      <SectorCard
        title="Custom Metrics"
        icon={BarChart3}
        stats={customStats}
        isEmpty={custom.length === 0}
      >
        <ChartWrapper type="bar" data={customChartData} height={200} />
      </SectorCard>
    </div>
  );
}
