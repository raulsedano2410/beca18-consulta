"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import Link from "next/link";
import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { useTheme } from "@/app/components/ThemeProvider";
import "@/lib/chart-config";
import { getChartColors } from "@/lib/chart-config";

interface ResultadoData {
  tipo: string;
  datos: Record<string, unknown>;
  ranking_general?: number;
  total_general?: number;
  ranking_modalidad?: number;
  total_modalidad?: number;
  ranking_regional?: number;
  total_region?: number;
  percentil?: number;
  mismo_puntaje_global?: number;
  distribucion?: { puntaje: number; cantidad: number }[];
  corte?: {
    modalidad: string;
    min_preseleccionado: number;
    max_preseleccionado: number;
    vacantes_preseleccion: number;
    becas_disponibles: number;
  };
  puntos_faltantes?: number;
  cerca_del_corte?: {
    a_1_punto: number;
    a_2_puntos: number;
    a_5_puntos: number;
    a_10_puntos: number;
  };
  causal_descripcion?: string;
  stats_causales?: { causal_codigo: string; causal_descripcion: string; cantidad: number }[];
  error?: string;
}

export default function ResultadoPage({
  params,
}: {
  params: Promise<{ dni: string }>;
}) {
  const { dni } = use(params);
  const [data, setData] = useState<ResultadoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/resultado/${dni}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ tipo: "error", datos: {}, error: "Error de conexion" }))
      .finally(() => setLoading(false));
  }, [dni]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.error === "DNI no encontrado") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">?</div>
        <h1 className="text-2xl font-bold mb-2">DNI no encontrado</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          El DNI {dni} no aparece en los resultados de Beca 18 - Convocatoria
          2026.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (data.tipo === "preseleccionado") return <Preseleccionado data={data} />;
  if (data.tipo === "no_preseleccionado") return <NoPreseleccionado data={data} />;
  if (data.tipo === "descalificado") return <Descalificado data={data} />;

  return null;
}

function Preseleccionado({ data }: { data: ResultadoData }) {
  const d = data.datos as Record<string, unknown>;
  const puntaje = d.puntaje_final as number;
  const corteMin = data.corte?.min_preseleccionado || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold w-fit">
            PRESELECCIONADO
          </span>
          <span className="text-green-800 dark:text-green-300 font-semibold text-sm">
            {d.modalidad as string}
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold mb-1">
          {d.apellidos_nombres as string}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          DNI: {d.dni as string} | Region: {d.region as string}
        </p>
      </div>

      {/* Puntajes */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <ScoreCard label="Puntaje Final" value={puntaje} big accent="green" />
        <ScoreCard label="Puntaje ENP" value={d.puntaje_enp as number} />
        <ScoreCard
          label="Cond. Priorizables"
          value={d.condiciones_priorizables as number}
          accent="purple"
        />
        {d.caracteristicas_labor_docente != null && (
          <ScoreCard
            label="Labor Docente"
            value={d.caracteristicas_labor_docente as number}
          />
        )}
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <RankingCard
          label="Ranking General"
          value={`#${data.ranking_general?.toLocaleString()}`}
          sub={`de ${data.total_general?.toLocaleString()}`}
          icon="general"
        />
        <RankingCard
          label={`En ${(d.modalidad as string).replace('BECA 18 ', '').replace('BECA ', '')}`}
          value={`#${data.ranking_modalidad?.toLocaleString()}`}
          sub={`de ${data.total_modalidad?.toLocaleString()}`}
          icon="modalidad"
        />
        <RankingCard
          label={`En ${d.region as string}`}
          value={`#${data.ranking_regional?.toLocaleString()}`}
          sub={`de ${data.total_region?.toLocaleString()}`}
          icon="region"
        />
        <RankingCard
          label="Percentil"
          value={`Top ${data.percentil}%`}
          sub={`${data.mismo_puntaje_global} con igual puntaje`}
          icon="percentil"
        />
      </div>

      {/* Dato clave */}
      {data.corte && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Dato clave</p>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            De los {data.total_modalidad?.toLocaleString()} preseleccionados en{" "}
            {d.modalidad as string}, solo{" "}
            <strong>{data.corte.becas_disponibles.toLocaleString()}</strong>{" "}
            obtendran beca. Estas en el puesto{" "}
            <strong>#{data.ranking_modalidad?.toLocaleString()}</strong> de tu modalidad.
            {data.ranking_modalidad! <= data.corte.becas_disponibles ? (
              <span className="text-green-700 dark:text-green-400 font-bold">
                {" "}Tienes buenas posibilidades.
              </span>
            ) : (
              <span className="text-amber-800 dark:text-amber-300">
                {" "}El simulador te ayudara a maximizar tu puntaje de seleccion.
              </span>
            )}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
            Tu puntaje ({puntaje}) esta {puntaje - corteMin} puntos por encima
            del corte ({corteMin}).
          </p>
        </div>
      )}

      {/* Grafico de distribucion */}
      {data.distribucion && data.distribucion.length > 0 && (
        <DistribucionChart
          distribucion={data.distribucion}
          puntaje={puntaje}
          highlightColor="#dc2626"
          baseColor="#3b82f6"
          titulo={`Distribucion de puntajes — ${d.modalidad as string}`}
          referenceLines={[{ x: puntaje, color: "#dc2626", label: "Tu" }]}
        />
      )}

      {/* CTA Simulador */}
      <div className="text-center">
        <Link
          href={`/simulador?dni=${d.dni}`}
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow cursor-pointer"
        >
          Simular mi puntaje de seleccion
        </Link>
      </div>
    </div>
  );
}

function NoPreseleccionado({ data }: { data: ResultadoData }) {
  const d = data.datos as Record<string, unknown>;
  const puntaje = d.puntaje_final as number;
  const corteMin = data.corte?.min_preseleccionado || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <span className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold w-fit">
            NO PRESELECCIONADO
          </span>
          <span className="text-red-800 dark:text-red-300 font-semibold text-sm">
            {d.modalidad as string}
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold mb-1">
          {d.apellidos_nombres as string}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          DNI: {d.dni as string} | Region: {(d.region as string) || "—"}
        </p>
      </div>

      {/* Puntajes */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <ScoreCard label="Tu Puntaje Final" value={puntaje} big />
        <ScoreCard label="Puntaje de Corte" value={corteMin} />
        <div className="bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 p-4 text-center col-span-2 md:col-span-1">
          <p className="text-xs text-red-500 dark:text-red-400 mb-1">Te faltaron</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{data.puntos_faltantes}</p>
          <p className="text-xs text-red-400 dark:text-red-500">puntos</p>
        </div>
      </div>

      {/* Desglose */}
      <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 mb-6">
        <h3 className="font-semibold text-sm mb-3">Desglose de tu puntaje</h3>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Puntaje ENP</span>
            <span className="font-semibold">{d.puntaje_enp as number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Condiciones Priorizables</span>
            <span className="font-semibold">
              {d.condiciones_priorizables as number}
            </span>
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />
          <div className="flex justify-between">
            <span className="text-gray-700 dark:text-gray-200 font-semibold">Puntaje Final</span>
            <span className="font-bold text-lg">{puntaje}</span>
          </div>
        </div>
      </div>

      {/* Cerca del corte */}
      {data.cerca_del_corte && (
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 mb-6">
          <h3 className="font-semibold text-sm mb-3">
            ¿Cuantos estuvieron cerca del corte en {d.modalidad as string}?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <MiniStat
              label="A 1 punto"
              value={data.cerca_del_corte.a_1_punto}
            />
            <MiniStat
              label="A 2 puntos"
              value={data.cerca_del_corte.a_2_puntos}
            />
            <MiniStat
              label="A 5 puntos"
              value={data.cerca_del_corte.a_5_puntos}
            />
            <MiniStat
              label="A 10 puntos"
              value={data.cerca_del_corte.a_10_puntos}
            />
          </div>
        </div>
      )}

      {/* Simulador */}
      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 p-4 mb-6">
        <h3 className="font-semibold text-sm mb-2 text-blue-800 dark:text-blue-300">
          ¿Que hubiera pasado si...?
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">
          Si hubieras obtenido{" "}
          <strong>{data.puntos_faltantes} puntos mas</strong> en condiciones
          priorizables, habrias alcanzado el puntaje de corte.
        </p>
        <p className="text-xs text-blue-500 dark:text-blue-400">
          Las condiciones priorizables incluyen: discapacidad, orfandad, victima
          de violencia, lengua originaria, entre otros.
        </p>
      </div>

      {/* Distribucion */}
      {data.distribucion && data.distribucion.length > 0 && (
        <DistribucionChart
          distribucion={data.distribucion}
          puntaje={puntaje}
          highlightColor="#dc2626"
          baseColor="#fca5a5"
          titulo={`Distribucion de puntajes — No Preseleccionados ${d.modalidad as string}`}
          referenceLines={[
            { x: corteMin, color: "#16a34a", label: "Corte" },
            { x: puntaje, color: "#dc2626", label: "Tu" },
          ]}
        />
      )}

      {/* Mensaje motivacional */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-800 p-4 md:p-6 text-center">
        <h3 className="font-bold text-lg mb-2 text-blue-800 dark:text-blue-300">
          No te desanimes
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400 max-w-lg mx-auto">
          La proxima convocatoria es una nueva oportunidad. Tambien puedes
          explorar otros programas de PRONABEC como Beca Permanencia, Beca
          Continuidad, o postular a otra modalidad si cumples los requisitos.
        </p>
      </div>
    </div>
  );
}

function Descalificado({ data }: { data: ResultadoData }) {
  const d = data.datos as Record<string, unknown>;
  const causal = d.causal as string;

  const causalesHumanas: Record<string, { titulo: string; detalle: string }> = {
    "7.11.3": {
      titulo: "No te presentaste al Examen Nacional de Preseleccion",
      detalle:
        "La inasistencia al ENP resulta en descalificacion automatica. Esta fue la causa del 99.4% de las descalificaciones.",
    },
    "7.11.4": {
      titulo: "Se detecto una irregularidad durante el examen",
      detalle:
        "Esto incluye copia, suplantacion de identidad, uso de dispositivos electronicos u otra conducta indebida.",
    },
    "7.11.2": {
      titulo: "No cumpliste los requisitos de identificacion",
      detalle:
        "No se cumplio con los requisitos de identificacion o registro para rendir el examen.",
    },
  };

  let causalInfo = { titulo: data.causal_descripcion || causal, detalle: "" };
  for (const [key, val] of Object.entries(causalesHumanas)) {
    if (causal.includes(key)) {
      causalInfo = val;
      break;
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <span className="bg-gray-700 text-white px-4 py-1 rounded-full text-sm font-semibold w-fit">
            DESCALIFICADO
          </span>
          <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">
            {d.modalidad as string}
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold mb-1">
          {d.apellidos_nombres as string}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">DNI: {d.dni as string}</p>
      </div>

      {/* Causal */}
      <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 md:p-6 mb-6">
        <h3 className="text-xs text-gray-500 dark:text-gray-400 mb-2">Motivo de descalificacion</h3>
        <p className="text-lg font-semibold mb-2">
          {causalInfo.titulo}
        </p>
        {causalInfo.detalle && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{causalInfo.detalle}</p>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Referencia normativa: {causal}
        </p>
      </div>

      {/* Stats */}
      {data.stats_causales && (
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 mb-6">
          <h3 className="font-semibold text-sm mb-3">
            Descalificaciones en esta convocatoria
          </h3>
          <div className="space-y-2">
            {data.stats_causales.map(
              (s: { causal_codigo: string; causal_descripcion: string; cantidad: number }) => (
                <div
                  key={s.causal_codigo}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm"
                >
                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {s.causal_descripcion}
                  </span>
                  <span className="font-semibold shrink-0">
                    {s.cantidad.toLocaleString()}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Orientacion */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-800 p-4 md:p-6 text-center">
        <h3 className="font-bold text-lg mb-2 text-blue-800 dark:text-blue-300">¿Que puedes hacer?</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 text-left max-w-md mx-auto space-y-2">
          <li>
            Postula en la proxima convocatoria de Beca 18 (asegurate de
            presentarte al examen).
          </li>
          <li>
            Explora otros programas de PRONABEC como Beca Permanencia o Beca
            Continuidad.
          </li>
          <li>
            Consulta la pagina oficial de PRONABEC para nuevas oportunidades.
          </li>
        </ul>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  big,
  accent,
}: {
  label: string;
  value: number;
  big?: boolean;
  accent?: "green" | "blue" | "purple";
}) {
  const colors = {
    green: "from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400",
    blue: "from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400",
  };
  const c = colors[accent || "blue"];

  return (
    <div
      className={`bg-gradient-to-br ${c} rounded-xl border p-4 md:p-5 flex flex-col items-center justify-center ${
        big ? "col-span-2 md:col-span-1" : ""
      }`}
    >
      <p className="text-[11px] md:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <p
        className={`font-extrabold leading-none ${
          big ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function RankingCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: "general" | "modalidad" | "region" | "percentil";
}) {
  const iconMap = {
    general: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 18m0 0L12 13.5m4.5 4.5V4.5" />
      </svg>
    ),
    modalidad: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
      </svg>
    ),
    region: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
    percentil: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  };

  const colors = {
    general: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
    modalidad: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40",
    region: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
    percentil: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
  };

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 md:p-5 flex flex-col items-center text-center gap-2">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${colors[icon]}`}>
        {iconMap[icon]}
      </div>
      <p className="text-[10px] md:text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
        {label}
      </p>
      <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-none">
        {value}
      </p>
      <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500">
        {sub}
      </p>
    </div>
  );
}

function DistribucionChart({
  distribucion,
  puntaje,
  highlightColor,
  baseColor,
  titulo,
  referenceLines,
}: {
  distribucion: { puntaje: number; cantidad: number }[];
  puntaje: number;
  highlightColor: string;
  baseColor: string;
  titulo: string;
  referenceLines: { x: number; color: string; label: string }[];
}) {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";
  const colors = getChartColors(isDark);

  const chartData: ChartData<"bar"> = {
    labels: distribucion.map((d) => d.puntaje),
    datasets: [
      {
        label: "Personas",
        data: distribucion.map((d) => d.cantidad),
        backgroundColor: distribucion.map((d) =>
          d.puntaje === puntaje ? highlightColor : baseColor
        ),
        borderRadius: 2,
      },
    ],
  };

  const annotationPlugin = useCallback(() => ({
    id: "refLines",
    afterDraw(chart: import("chart.js").Chart) {
      const { ctx, scales } = chart;
      const xScale = scales.x;
      const yScale = scales.y;
      if (!xScale || !yScale) return;

      for (const ref of referenceLines) {
        const idx = distribucion.findIndex((d) => d.puntaje === ref.x);
        if (idx < 0) continue;
        const xPos = xScale.getPixelForValue(idx);
        ctx.save();
        ctx.strokeStyle = ref.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xPos, yScale.top);
        ctx.lineTo(xPos, yScale.bottom);
        ctx.stroke();
        // Label
        ctx.setLineDash([]);
        ctx.fillStyle = ref.color;
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(ref.label, xPos, yScale.top - 4);
        ctx.restore();
      }
    },
  }), [referenceLines, distribucion]);

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: "easeOutQuart" },
    scales: {
      x: {
        ticks: { color: colors.textMuted, font: { size: 10 }, maxTicksLimit: 15 },
        grid: { display: false },
      },
      y: {
        ticks: { color: colors.textMuted, font: { size: 10 } },
        grid: { color: colors.gridColor },
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
          title: (items) => `Puntaje: ${items[0]?.label}`,
          label: (ctx) => ` ${ctx.parsed.y} personas`,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 mb-6">
      <h3 className="font-semibold text-sm mb-4">{titulo}</h3>
      <div className="h-48 md:h-64">
        <Bar data={chartData} options={options} plugins={[annotationPlugin()]} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex flex-col items-center gap-1">
      <p className="text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white">
        {value.toLocaleString()}
      </p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500">personas</p>
    </div>
  );
}
