"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { estadisticasData } from "@/lib/data/estadisticas";

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
  const stats = {
    totales: estadisticasData.totales,
    cortes: estadisticasData.cortes as unknown as Corte[],
  };
  const [highlighted, setHighlighted] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

      {/* Sobre este sitio */}
      <section className="max-w-4xl mx-auto px-4 mt-8 mb-2">
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 md:p-6">
          <div className="flex gap-4 items-start">
            <div className="shrink-0 w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-200 text-sm md:text-base mb-1">
                ¿Quien hizo esta pagina?
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                Soy <strong>Raul Sedano</strong>, programador e ingeniero. Cree esta herramienta para ayudar a mi hija a entender su resultado
                de preseleccion y simular opciones que le den un mejor puntaje de seleccion para ganar su beca. La comparto con todas las
                familias que estan en la misma situacion.
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Este sitio no almacena datos personales. Solo consulta informacion publica publicada por PRONABEC.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats generales */}
      <section className="max-w-7xl mx-auto px-4 mt-6 relative z-[5]">
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

      {/* Modalidades con puntajes de corte */}
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

      {/* Fuentes oficiales */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full px-4 py-1.5 mb-4">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Informacion 100% oficial</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Fuentes y documentos oficiales</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xl mx-auto">
            Todos los datos de esta pagina provienen exclusivamente de documentos publicados por PRONABEC en su sitio web oficial.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <SourceCard
            icon="documento"
            title="RJ N° 509-2026 — Resultados de Preseleccion"
            desc="Resolucion Jefatural que aprueba los resultados oficiales de la etapa de preseleccion"
          />
          <SourceCard
            icon="lista"
            title="Anexo 1 — Lista de Preseleccionados"
            desc="PDF oficial con los 16,148 postulantes preseleccionados y sus puntajes"
          />
          <SourceCard
            icon="lista"
            title="Anexo 2 — Lista de No Preseleccionados"
            desc="PDF oficial con los 73,162 postulantes no preseleccionados"
          />
          <SourceCard
            icon="libro"
            title="Expediente Tecnico — Bases del Concurso 2026"
            desc="RDE N° 033-2026: requisitos, formula de puntaje y proceso de seleccion"
          />
          <SourceCard
            icon="documento"
            title="RJ N° 508-2026 — IES Elegibles"
            desc="5,541 programas en universidades, institutos y escuelas aprobados para Beca 18"
          />
          <SourceCard
            icon="ranking"
            title="Clasificacion de Universidades y EESP"
            desc="Grupos 1, 2 y 3 para el calculo del puntaje de seleccion"
          />
          <SourceCard
            icon="ranking"
            title="Clasificacion de Institutos Tecnologicos"
            desc="Grupos 1, 2 y 3 de institutos y escuelas tecnologicas"
          />
          <SourceCard
            icon="libro"
            title="Temario del Examen Nacional de Preseleccion"
            desc="Contenidos evaluados en el ENP de Beca 18"
          />
          <SourceCard
            icon="web"
            title="PRONABEC — Pagina Oficial Beca 18"
            desc="Todos estos documentos estan disponibles para descarga en el sitio oficial"
            highlight
          />
        </div>
        <div className="text-center">
          <a
            href="https://www.pronabec.gob.pe/beca-18/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Ver todos los documentos en pronabec.gob.pe
          </a>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Enlace directo al sitio oficial del gobierno peruano
          </p>
        </div>
      </section>

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

function SourceCard({
  icon,
  title,
  desc,
  highlight,
}: {
  icon: "documento" | "libro" | "lista" | "ranking" | "web";
  title: string;
  desc: string;
  highlight?: boolean;
}) {
  const icons = {
    documento: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    libro: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    lista: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
      </svg>
    ),
    ranking: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.77.853 6.023 6.023 0 0 1-2.77-.853" />
      </svg>
    ),
    web: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  };

  return (
    <div
      className={`rounded-xl border p-4 flex gap-3 items-start ${
        highlight
          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
          : "bg-white dark:bg-card border-gray-200 dark:border-card-border"
      }`}
    >
      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
        highlight
          ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
      }`}>
        {icons[icon]}
      </div>
      <div className="min-w-0">
        <h3 className={`font-semibold text-sm leading-tight mb-1 ${
          highlight ? "text-green-800 dark:text-green-200" : "text-gray-800 dark:text-gray-100"
        }`}>
          {title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}
