import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components (tree-shaking)
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export function getChartColors(isDark: boolean) {
  return {
    text: isDark ? "#e5e7eb" : "#374151",
    textMuted: isDark ? "#9ca3af" : "#6b7280",
    gridColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    tooltipBg: isDark ? "#1f2937" : "#ffffff",
    tooltipBorder: isDark ? "#374151" : "#e5e7eb",
    tooltipText: isDark ? "#f3f4f6" : "#111827",
  };
}
