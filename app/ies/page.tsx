"use client";

import { useEffect, useState, useCallback } from "react";

interface IES {
  id: number;
  item: number;
  ies: string;
  tipo_ies: string;
  tipo_gestion: string;
  departamento: string;
  sede_distrito: string;
  programa_academico: string;
  modalidad_estudio: string;
  es_eib: boolean;
}

interface Filtros {
  departamentos: string[];
  tipos_ies: string[];
}

export default function IESPage() {
  const [ies, setIes] = useState<IES[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtros, setFiltros] = useState<Filtros>({ departamentos: [], tipos_ies: [] });
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [depto, setDepto] = useState("");
  const [tipo, setTipo] = useState("");
  const [gestion, setGestion] = useState("");

  const fetchIES = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (q.length >= 2) params.set("q", q);
    if (depto) params.set("departamento", depto);
    if (tipo) params.set("tipo_ies", tipo);
    if (gestion) params.set("gestion", gestion);

    try {
      const res = await fetch(`/api/ies?${params.toString()}`);
      const data = await res.json();
      setIes(data.ies || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
      if (data.filtros) setFiltros(data.filtros);
    } catch {
      setIes([]);
    }
    setLoading(false);
  }, [q, depto, tipo, gestion]);

  useEffect(() => {
    const timer = setTimeout(() => fetchIES(1), 300);
    return () => clearTimeout(timer);
  }, [fetchIES]);

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      fetchIES(1);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        IES Elegibles
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        {total.toLocaleString()} programas elegibles para Beca 18 - Convocatoria
        2026
      </p>

      {/* Filtros */}
      <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar IES o carrera..."
            className="border border-gray-300 dark:border-input-border dark:bg-muted-bg dark:text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <select
            value={depto}
            onChange={(e) => setDepto(e.target.value)}
            className="border border-gray-300 dark:border-input-border dark:bg-muted-bg dark:text-foreground rounded-lg px-3 py-2 text-sm cursor-pointer"
          >
            <option value="">Todas las regiones</option>
            {filtros.departamentos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border border-gray-300 dark:border-input-border dark:bg-muted-bg dark:text-foreground rounded-lg px-3 py-2 text-sm cursor-pointer"
          >
            <option value="">Todos los tipos</option>
            {filtros.tipos_ies.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={gestion}
            onChange={(e) => setGestion(e.target.value)}
            className="border border-gray-300 dark:border-input-border dark:bg-muted-bg dark:text-foreground rounded-lg px-3 py-2 text-sm cursor-pointer"
          >
            <option value="">Publica y Privada</option>
            <option value="PUBLICA">Publica</option>
            <option value="PRIVADA">Privada</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Vista movil: cards */}
          <div className="block lg:hidden space-y-3 mb-6">
            {ies.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-400 leading-tight">
                    {item.ies}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      item.tipo_gestion === "PUBLICA"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
                    }`}
                  >
                    {item.tipo_gestion}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  {item.programa_academico}
                  {item.es_eib && (
                    <span className="ml-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-1 rounded">
                      EIB
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{item.departamento}</span>
                  <span>{item.sede_distrito}</span>
                  <span>{item.modalidad_estudio}</span>
                  <span className="text-gray-400 dark:text-gray-500">{item.tipo_ies}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Vista desktop: tabla */}
          <div className="hidden lg:block overflow-x-auto mb-6">
            <table className="w-full text-sm bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border">
              <thead>
                <tr className="border-b border-gray-200 dark:border-card-border text-left bg-gray-50 dark:bg-gray-800">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">IES</th>
                  <th className="py-2 px-3">Programa</th>
                  <th className="py-2 px-3">Tipo</th>
                  <th className="py-2 px-3">Gestion</th>
                  <th className="py-2 px-3">Region</th>
                  <th className="py-2 px-3">Sede</th>
                  <th className="py-2 px-3">Modalidad</th>
                </tr>
              </thead>
              <tbody>
                {ies.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  >
                    <td className="py-2 px-3 text-gray-400">{item.item}</td>
                    <td className="py-2 px-3 font-medium text-xs max-w-[200px] truncate">
                      {item.ies}
                    </td>
                    <td className="py-2 px-3 text-xs max-w-[200px] truncate">
                      {item.programa_academico}
                      {item.es_eib && (
                        <span className="ml-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-1 rounded">
                          EIB
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-500 dark:text-gray-400">
                      {item.tipo_ies.replace("ESCUELA DE EDUCACION ", "").replace("INSTITUTO DE EDUCACION ", "")}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          item.tipo_gestion === "PUBLICA"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"
                        }`}
                      >
                        {item.tipo_gestion}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs">{item.departamento}</td>
                    <td className="py-2 px-3 text-xs">{item.sede_distrito}</td>
                    <td className="py-2 px-3 text-xs">{item.modalidad_estudio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginacion */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <p className="text-gray-500 dark:text-gray-400">
              Pagina {page} de {totalPages} ({total.toLocaleString()} resultados)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchIES(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-card-border hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Anterior
              </button>
              <button
                onClick={() => fetchIES(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-card-border hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
