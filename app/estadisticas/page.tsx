"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

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

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export default function EstadisticasPage() {
  const [data, setData] = useState<EstadisticasData | null>(null);
  const [modalidadSel, setModalidadSel] = useState("");

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

  const pieData = [
    { name: "Preseleccionados", value: data.totales.preseleccionados, color: "#10b981" },
    { name: "No Preseleccionados", value: data.totales.no_preseleccionados, color: "#ef4444" },
    { name: "Descalificados", value: data.totales.descalificados, color: "#6b7280" },
  ];

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
      region: region.length > 12 ? region.slice(0, 10) + "..." : region,
      regionFull: region,
      preseleccionados: counts.pre,
      no_preseleccionados: counts.nopre,
      total: counts.pre + counts.nopre,
    }))
    .sort((a, b) => b.total - a.total);

  const top10Filtered = data.top10.filter(
    (t) => t.modalidad === modalidadSel
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">
        Estadisticas del Concurso
      </h1>

      {/* Proporcion general */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4">
          <h2 className="font-semibold text-sm mb-4">
            Distribucion general ({data.totales.total.toLocaleString()}{" "}
            postulantes)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(props) =>
                    `${props.name ?? ''}: ${(((props.percent as number) ?? 0) * 100).toFixed(1)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4">
          <h2 className="font-semibold text-sm mb-4">
            Puntajes de corte por modalidad
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.cortes.map((c) => ({
                  ...c,
                  modalidad:
                    c.modalidad.length > 15
                      ? c.modalidad.slice(0, 13) + "..."
                      : c.modalidad,
                }))}
                layout="vertical"
              >
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  dataKey="modalidad"
                  type="category"
                  tick={{ fontSize: 9 }}
                  width={100}
                />
                <Tooltip />
                <Bar
                  dataKey="min_preseleccionado"
                  fill="#3b82f6"
                  name="Puntaje de corte"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Por region */}
      <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 mb-8">
        <h2 className="font-semibold text-sm mb-4">Postulantes por region</h2>
        <div className="h-72 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionData}>
              <XAxis
                dataKey="region"
                tick={{ fontSize: 8 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                labelFormatter={(_, payload) => {
                  if (payload?.[0]) {
                    return (payload[0].payload as typeof regionData[number]).regionFull;
                  }
                  return '';
                }}
                formatter={(v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              />
              <Legend />
              <Bar
                dataKey="preseleccionados"
                fill="#10b981"
                name="Preseleccionados"
                stackId="a"
              />
              <Bar
                dataKey="no_preseleccionados"
                fill="#fca5a5"
                name="No Preseleccionados"
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Por modalidad */}
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
                {c.cantidad.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
