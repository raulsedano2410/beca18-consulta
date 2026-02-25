"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface Resultado {
  dni: string;
  nombre: string;
  tipo: string;
  modalidad: string;
}

interface Corte {
  modalidad: string;
  min_preseleccionado: number;
  vacantes_preseleccion: number;
  becas_disponibles: number;
}

interface Totales {
  preseleccionados: number;
  no_preseleccionados: number;
  descalificados: number;
  total: number;
}

const BADGE_COLORS: Record<string, string> = {
  preseleccionado: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  no_preseleccionado: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  descalificado: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const BADGE_LABELS: Record<string, string> = {
  preseleccionado: "Preseleccionado",
  no_preseleccionado: "No Preseleccionado",
  descalificado: "Descalificado",
};

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ totales: Totales; cortes: Corte[] } | null>(null);
  const [highlighted, setHighlighted] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/estadisticas")
      .then((r) => r.json())
      .then((data) => setStats({ totales: data.totales, cortes: data.cortes }))
      .catch(() => {});
  }, []);

  const buscar = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResultados([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResultados(data.resultados || []);
      setHighlighted(-1);
    } catch {
      setResultados([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => buscar(query), 300);
    return () => clearTimeout(timer);
  }, [query, buscar]);

  const irAResultado = (dni: string) => {
    setResultados([]);
    setQuery("");
    router.push(`/resultado/${dni}`);
  };

  function handleKeyDown(e: React.KeyboardEvent) {
    if (resultados.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      irAResultado(resultados[highlighted].dni);
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll("button");
      items[highlighted]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 dark:from-gray-900 dark:to-blue-950 text-white py-10 md:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            Beca 18 — Resultados 2026
          </h1>
          <p className="text-blue-100 dark:text-blue-200 text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Consulta tu resultado de preseleccion, conoce tu ranking y simula tu
            puntaje de seleccion
          </p>

          {/* Buscador */}
          <div className="max-w-xl mx-auto relative">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <svg
                className="w-5 h-5 ml-4 text-gray-400 dark:text-gray-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ingresa tu DNI o nombre completo..."
                className="w-full px-4 py-4 text-gray-800 dark:text-gray-100 dark:bg-gray-800 text-base md:text-lg focus:outline-none"
              />
              {loading && (
                <div className="mr-4 shrink-0">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Resultados dropdown */}
            {resultados.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden z-10 max-h-80 overflow-y-auto"
              >
                {resultados.map((r, i) => (
                  <button
                    key={`${r.dni}-${i}`}
                    onClick={() => irAResultado(r.dni)}
                    className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 cursor-pointer ${
                      i === highlighted
                        ? "bg-blue-50 dark:bg-blue-900/30"
                        : "hover:bg-blue-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="text-gray-800 dark:text-gray-100 font-medium text-sm sm:text-base truncate">
                      {r.nombre}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">DNI: {r.dni}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${BADGE_COLORS[r.tipo]}`}
                      >
                        {BADGE_LABELS[r.tipo]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats generales */}
      {stats && (
        <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-[5]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatCard
              label="Total Postulantes"
              value={stats.totales.total.toLocaleString()}
              color="bg-white dark:bg-card"
            />
            <StatCard
              label="Preseleccionados"
              value={stats.totales.preseleccionados.toLocaleString()}
              color="bg-green-50 dark:bg-green-950/40"
              accent="text-green-700 dark:text-green-400"
            />
            <StatCard
              label="No Preseleccionados"
              value={stats.totales.no_preseleccionados.toLocaleString()}
              color="bg-red-50 dark:bg-red-950/40"
              accent="text-red-700 dark:text-red-400"
            />
            <StatCard
              label="Descalificados"
              value={stats.totales.descalificados.toLocaleString()}
              color="bg-gray-50 dark:bg-gray-800"
              accent="text-gray-700 dark:text-gray-300"
            />
          </div>
        </section>
      )}

      {/* Modalidades con puntajes de corte */}
      {stats?.cortes && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Puntajes de Corte por Modalidad
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stats.cortes.map((c) => (
              <div
                key={c.modalidad}
                className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-card-border p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-sm mb-3 text-blue-800 dark:text-blue-400 leading-tight">
                  {c.modalidad}
                </h3>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {c.min_preseleccionado}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm pb-1">puntos de corte</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Pasaron: {c.vacantes_preseleccion.toLocaleString()}</span>
                  <span>Becas: {c.becas_disponibles.toLocaleString()}</span>
                </div>
                <div className="mt-2 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{
                      width: `${(c.becas_disponibles / c.vacantes_preseleccion) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Solo {((c.becas_disponibles / c.vacantes_preseleccion) * 100).toFixed(0)}% de los que pasaron recibiran beca
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-blue-50 dark:bg-blue-950/30 py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">
            ¿Fuiste preseleccionado?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xl mx-auto">
            Usa nuestro simulador para estimar tu puntaje de seleccion
            eligiendo tu IES y carrera preferida.
          </p>
          <a
            href="/simulador"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow cursor-pointer"
          >
            Ir al Simulador
          </a>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  accent,
}: {
  label: string;
  value: string;
  color: string;
  accent?: string;
}) {
  return (
    <div className={`${color} rounded-xl shadow-sm border border-gray-200 dark:border-card-border p-4 text-center`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-xl md:text-2xl font-bold ${accent || "text-gray-800 dark:text-gray-100"}`}>
        {value}
      </p>
    </div>
  );
}
