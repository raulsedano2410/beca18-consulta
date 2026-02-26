"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { useTheme } from "@/app/components/ThemeProvider";
import { useCountUp } from "@/lib/hooks/useCountUp";
import "@/lib/chart-config"; // registers Chart.js components
import { getChartColors } from "@/lib/chart-config";

interface EstadisticasData {
  totales: {
    preseleccionados: number;
    no_preseleccionados: number;
    descalificados: number;
    total: number;
  };
  por_modalidad_pre: {
    modalidad: string;
    total: number;
    pmin: number;
    pmax: number;
    pavg: number;
  }[];
  por_modalidad_nopre: {
    modalidad: string;
    total: number;
  }[];
  por_region_pre: { region: string; total: number }[];
  por_region_nopre: { region: string; total: number }[];
  top10: {
    modalidad: string;
    apellidos_nombres: string;
    region: string;
    puntaje_final: number;
  }[];
  cortes: {
    modalidad: string;
    min_preseleccionado: number;
    becas_disponibles: number;
    vacantes_preseleccion: number;
  }[];
  causales: {
    causal_codigo: string;
    causal_descripcion: string;
    cantidad: number;
  }[];
}

function AnimatedNumber({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <>{animated.toLocaleString()}</>;
}

export default function EstadisticasPage() {
  const [data, setData] = useState<EstadisticasData | null>(null);
  const [modalidadSel, setModalidadSel] = useState("");
  const { resolved } = useTheme();
  const isDark = resolved === "dark";

  useEffect(() => {
    fetch("/api/estadisticas")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.por_modalidad_pre?.length > 0) {
          setModalidadSel(d.por_modalidad_pre[0].modalidad);
        }
      })
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const regionMap = new Map<string, { pre: number; nopre: number }>();
  data.por_region_pre.forEach((r) => {
    regionMap.set(r.region, { pre: r.total, nopre: 0 });
  });
  data.por_region_nopre.forEach((r) => {
    const existing = regionMap.get(r.region);
    if (existing) existing.nopre = r.total;
    else regionMap.set(r.region, { pre: 0, nopre: r.total });
  });
  const regionData = Array.from(regionMap.entries())
    .map(([region, counts]) => ({
      region,
      regionShort: region.length > 12 ? region.slice(0, 10) + "..." : region,
      pre: counts.pre,
      nopre: counts.nopre,
      total: counts.pre + counts.nopre,
    }))
    .sort((a, b) => b.total - a.total);

  const top10Filtered = data.top10.filter((t) => t.modalidad === modalidadSel);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">
        Estadisticas del Concurso
      </h1>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4">
          <h2 className="font-semibold text-sm mb-4">
            Distribucion general (<AnimatedNumber value={data.totales.total} /> postulantes)
          </h2>
          <DoughnutChart data={data} isDark={isDark} />
        </div>

        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4">
          <h2 className="font-semibold text-sm mb-4">
            Puntajes de corte por modalidad
          </h2>
          <CortesBarChart cortes={data.cortes} isDark={isDark} />
        </div>
      </div>

      {/* Region chart */}
      <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 mb-8">
        <h2 className="font-semibold text-sm mb-4">Postulantes por region</h2>
        <RegionBarChart regionData={regionData} isDark={isDark} />
      </div>

      {/* Modalidades table */}
      <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 mb-8">
        <h2 className="font-semibold text-sm mb-4">
          Preseleccionados por modalidad
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-card-border text-left">
                <th className="py-2 pr-4">Modalidad</th>
                <th className="py-2 px-2 text-right">Pre</th>
                <th className="py-2 px-2 text-right">No Pre</th>
                <th className="py-2 px-2 text-right">Min</th>
                <th className="py-2 px-2 text-right">Max</th>
                <th className="py-2 px-2 text-right">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {data.por_modalidad_pre.map((m) => {
                const nopre = data.por_modalidad_nopre.find(
                  (n) => n.modalidad === m.modalidad
                );
                return (
                  <tr
                    key={m.modalidad}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-2 pr-4 font-medium text-xs sm:text-sm">
                      {m.modalidad}
                    </td>
                    <td className="py-2 px-2 text-right text-green-700 dark:text-green-400">
                      {m.total.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">
                      {nopre?.total.toLocaleString() || "—"}
                    </td>
                    <td className="py-2 px-2 text-right">{m.pmin}</td>
                    <td className="py-2 px-2 text-right">{m.pmax}</td>
                    <td className="py-2 px-2 text-right">{m.pavg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 10 */}
      <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h2 className="font-semibold text-sm">Top 10 puntajes</h2>
          <select
            value={modalidadSel}
            onChange={(e) => setModalidadSel(e.target.value)}
            className="border border-gray-300 dark:border-input-border dark:bg-muted-bg dark:text-foreground rounded-lg px-3 py-1 text-sm cursor-pointer"
          >
            {data.por_modalidad_pre.map((m) => (
              <option key={m.modalidad} value={m.modalidad}>
                {m.modalidad}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-card-border text-left">
                <th className="py-2 w-8">#</th>
                <th className="py-2">Nombre</th>
                <th className="py-2">Region</th>
                <th className="py-2 text-right">Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {top10Filtered.map((t, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 text-gray-500 dark:text-gray-400">{i + 1}</td>
                  <td className="py-2 font-medium text-xs sm:text-sm">{t.apellidos_nombres}</td>
                  <td className="py-2 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{t.region}</td>
                  <td className="py-2 text-right font-bold text-blue-700 dark:text-blue-400">
                    {t.puntaje_final}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Causales */}
      <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4">
        <h2 className="font-semibold text-sm mb-4">
          Causales de descalificacion
        </h2>
        <div className="space-y-3">
          {data.causales.map((c) => (
            <div key={c.causal_codigo} className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
              <div>
                <p className="text-sm font-medium">{c.causal_codigo}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.causal_descripcion}</p>
              </div>
              <span className="font-bold text-lg shrink-0">
                <AnimatedNumber value={c.cantidad} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Chart Components ---

function DoughnutChart({ data, isDark }: { data: EstadisticasData; isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = getChartColors(isDark);

  const chartData: ChartData<"doughnut"> = {
    labels: ["Preseleccionados", "No Preseleccionados", "Descalificados"],
    datasets: [
      {
        data: [
          data.totales.preseleccionados,
          data.totales.no_preseleccionados,
          data.totales.descalificados,
        ],
        backgroundColor: ["#10b981", "#ef4444", "#6b7280"],
        borderColor: isDark ? "#1f2937" : "#ffffff",
        borderWidth: 3,
        borderRadius: 4,
        hoverOffset: 8,
      },
    ],
  };

  const centerTextPlugin = useCallback(() => ({
    id: "centerText",
    afterDraw(chart: import("chart.js").Chart) {
      const { ctx, width, height } = chart;
      ctx.save();
      ctx.font = `bold ${Math.min(width, height) * 0.09}px sans-serif`;
      ctx.fillStyle = isDark ? "#f3f4f6" : "#111827";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(data.totales.total.toLocaleString(), width / 2, height / 2 - 8);
      ctx.font = `${Math.min(width, height) * 0.05}px sans-serif`;
      ctx.fillStyle = isDark ? "#9ca3af" : "#6b7280";
      ctx.fillText("total", width / 2, height / 2 + 14);
      ctx.restore();
    },
  }), [isDark, data.totales.total]);

  const options: ChartOptions<"doughnut"> = {
    cutout: "60%",
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: "easeOutQuart" },
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: colors.text, padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.tooltipText,
        bodyColor: colors.tooltipText,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed;
            const pct = ((v / data.totales.total) * 100).toFixed(1);
            return ` ${ctx.label}: ${v.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Doughnut ref={canvasRef as never} data={chartData} options={options} plugins={[centerTextPlugin()]} />
    </div>
  );
}

function CortesBarChart({
  cortes,
  isDark,
}: {
  cortes: EstadisticasData["cortes"];
  isDark: boolean;
}) {
  const colors = getChartColors(isDark);
  const sorted = [...cortes].sort((a, b) => a.min_preseleccionado - b.min_preseleccionado);

  const chartData: ChartData<"bar"> = {
    labels: sorted.map((c) =>
      c.modalidad.length > 15 ? c.modalidad.slice(0, 13) + "..." : c.modalidad
    ),
    datasets: [
      {
        label: "Puntaje de corte",
        data: sorted.map((c) => c.min_preseleccionado),
        backgroundColor: isDark ? "rgba(59,130,246,0.7)" : "rgba(59,130,246,0.8)",
        borderColor: "#3b82f6",
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: "easeOutQuart" },
    scales: {
      x: {
        ticks: { color: colors.textMuted, font: { size: 10 } },
        grid: { color: colors.gridColor },
      },
      y: {
        ticks: { color: colors.textMuted, font: { size: 9 } },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.tooltipText,
        bodyColor: colors.tooltipText,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex;
            return idx !== undefined ? sorted[idx].modalidad : "";
          },
          label: (ctx) => ` Puntaje minimo: ${ctx.parsed.x}`,
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}

function RegionBarChart({
  regionData,
  isDark,
}: {
  regionData: { region: string; regionShort: string; pre: number; nopre: number; total: number }[];
  isDark: boolean;
}) {
  const colors = getChartColors(isDark);

  const chartData: ChartData<"bar"> = {
    labels: regionData.map((r) => r.regionShort),
    datasets: [
      {
        label: "Preseleccionados",
        data: regionData.map((r) => r.pre),
        backgroundColor: "rgba(16,185,129,0.8)",
        borderColor: "#10b981",
        borderWidth: 1,
        borderRadius: { topLeft: 6, topRight: 6 },
        stack: "a",
      },
      {
        label: "No Preseleccionados",
        data: regionData.map((r) => r.nopre),
        backgroundColor: "rgba(252,165,165,0.7)",
        borderColor: "#fca5a5",
        borderWidth: 1,
        borderRadius: { topLeft: 6, topRight: 6 },
        stack: "a",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: "easeOutQuart" },
    scales: {
      x: {
        ticks: { color: colors.textMuted, font: { size: 8 }, maxRotation: 45, minRotation: 45 },
        grid: { display: false },
        stacked: true,
      },
      y: {
        ticks: {
          color: colors.textMuted,
          font: { size: 10 },
          callback: (v) => {
            const num = Number(v);
            return num >= 1000 ? `${(num / 1000).toFixed(0)}k` : String(v);
          },
        },
        grid: { color: colors.gridColor },
        stacked: true,
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: { color: colors.text, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 }, padding: 16 },
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.tooltipText,
        bodyColor: colors.tooltipText,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex;
            return idx !== undefined ? regionData[idx].region : "";
          },
          label: (ctx) => ` ${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="h-72 md:h-96">
      <Bar data={chartData} options={options} />
    </div>
  );
}
