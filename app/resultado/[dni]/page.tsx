"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <ScoreCard label="Puntaje Final" value={puntaje} big />
        <ScoreCard label="Puntaje ENP" value={d.puntaje_enp as number} />
        <ScoreCard
          label="Cond. Priorizables"
          value={d.condiciones_priorizables as number}
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
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ranking General</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            #{data.ranking_general?.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            de {data.total_general?.toLocaleString()} preseleccionados
          </p>
        </div>
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Ranking en {d.modalidad as string}
          </p>
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
            #{data.ranking_modalidad?.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            de {data.total_modalidad?.toLocaleString()} en tu modalidad
          </p>
        </div>
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Ranking en {d.region as string}
          </p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            #{data.ranking_regional?.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            de {data.total_region?.toLocaleString()} en tu region
          </p>
        </div>
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Percentil en modalidad</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">Top {data.percentil}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data.mismo_puntaje_global} con tu mismo puntaje
          </p>
        </div>
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
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 mb-6">
          <h3 className="font-semibold text-sm mb-4">
            Distribucion de puntajes — {d.modalidad as string}
          </h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.distribucion}>
                <XAxis
                  dataKey="puntaje"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value) => [value ?? 0, "Personas"]}
                  labelFormatter={(label) => `Puntaje: ${label}`}
                />
                <ReferenceLine
                  x={puntaje}
                  stroke="#dc2626"
                  strokeDasharray="3 3"
                  label={{ value: "Tu", fill: "#dc2626", fontSize: 11 }}
                />
                <Bar dataKey="cantidad" radius={[2, 2, 0, 0]}>
                  {data.distribucion.map((entry) => (
                    <Cell
                      key={entry.puntaje}
                      fill={entry.puntaje === puntaje ? "#dc2626" : "#3b82f6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 mb-6">
          <h3 className="font-semibold text-sm mb-4">
            Distribucion de puntajes — No Preseleccionados{" "}
            {d.modalidad as string}
          </h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.distribucion}>
                <XAxis
                  dataKey="puntaje"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value) => [value ?? 0, "Personas"]}
                  labelFormatter={(label) => `Puntaje: ${label}`}
                />
                <ReferenceLine
                  x={corteMin}
                  stroke="#16a34a"
                  strokeDasharray="3 3"
                  label={{ value: "Corte", fill: "#16a34a", fontSize: 11 }}
                />
                <ReferenceLine
                  x={puntaje}
                  stroke="#dc2626"
                  strokeDasharray="3 3"
                  label={{ value: "Tu", fill: "#dc2626", fontSize: 11 }}
                />
                <Bar dataKey="cantidad" fill="#ef4444" radius={[2, 2, 0, 0]}>
                  {data.distribucion.map((entry) => (
                    <Cell
                      key={entry.puntaje}
                      fill={entry.puntaje === puntaje ? "#dc2626" : "#fca5a5"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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
}: {
  label: string;
  value: number;
  big?: boolean;
}) {
  return (
    <div
      className={`bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 text-center ${
        big ? "col-span-2 md:col-span-1" : ""
      }`}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p
        className={`font-bold text-blue-700 dark:text-blue-400 ${
          big ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold">
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-gray-400">personas</p>
    </div>
  );
}
