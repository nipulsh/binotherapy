"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartWrapperProps {
  type: "line" | "bar" | "doughnut";
  data: unknown;
  options?: unknown;
  height?: number;
}

export function ChartWrapper({
  type,
  data,
  options,
  height = 200,
}: ChartWrapperProps) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: type !== "doughnut" ? {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    } : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(options as any),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartProps: any = {
    data,
    options: defaultOptions,
  };

  return (
    <div style={{ height: `${height}px`, position: "relative" }}>
      {type === "line" && <Line {...chartProps} />}
      {type === "bar" && <Bar {...chartProps} />}
      {type === "doughnut" && <Doughnut {...chartProps} />}
    </div>
  );
}

