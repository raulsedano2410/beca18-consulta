"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCountUp } from "@/lib/hooks/useCountUp";
import iesRaw from "@/lib/data/ies-simulador.json";

const iesData = iesRaw as Record<string, { ti: string; tg: string; progs: { id: number; p: string; d: string; s: string; gr: number }[] }>;

// Pre-compute IES names list for step 2a
const iesNames = Object.entries(iesData)
  .filter(([name]) => name.length > 0)
  .map(([name, info]) => ({ name, ti: info.ti, tg: info.tg, progCount: info.progs.length }));

interface SelectedProg {
  id: number;
  ies: string;
  programa_academico: string;
  tipo_ies: string;
  tipo_gestion: string;
  departamento: string;
  sede_distrito: string;
}

interface IESGrupo {
  ies: string;
  tipo_ies: string;
  tipo_gestion: string;
  grupo: number;
}

interface SimulacionResult {
  persona: {
    dni: string;
    nombre: string;
    modalidad: string;
    region: string;
    puntaje_enp: number;
    condiciones_priorizables: number;
  };
  ies: {
    nombre: string;
    programa: string;
    tipo_ies: string;
    tipo_gestion: string;
    departamento: string;
    sede: string;
    grupo: number;
  };
  desglose: {
    enp: number;
    cp_original: number;
    pcp: number;
    clasificacion_ies: number;
    clasificacion_grupo: number;
    gestion_ies: number;
    pr_me: number;
    pr_me_tipo: string;
    pr_me_quintil: number;
    est: number;
    est_razon: string;
    est_campo_edo: string | null;
    ep: number;
    ep_razon: string;
    est_ep_usado: number;
  };
  puntaje_seleccion: number;
  corte?: {
    becas_disponibles: number;
    vacantes_preseleccion: number;
  };
}

export default function SimuladorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <SimuladorContent />
    </Suspense>
  );
}

function SimuladorContent() {
  const searchParams = useSearchParams();
  const dniParam = searchParams.get("dni") || "";

  const [dni, setDni] = useState(dniParam);
  const [persona, setPersona] = useState<SimulacionResult["persona"] | null>(null);
  const [buscandoDni, setBuscandoDni] = useState(false);
  // Step 2a: IES name
  const [iesNameQuery, setIesNameQuery] = useState("");
  const [selectedIESName, setSelectedIESName] = useState<string | null>(null);
  const [iesHighlighted, setIesHighlighted] = useState(-1);
  const iesDropdownRef = useRef<HTMLDivElement>(null);
  // Step 2b: Carrera
  const [carreraQuery, setCarreraQuery] = useState("");
  const [selectedProg, setSelectedProg] = useState<SelectedProg | null>(null);
  const [carreraHighlighted, setCarreraHighlighted] = useState(-1);
  const carreraDropdownRef = useRef<HTMLDivElement>(null);

  const [mismaRegion, setMismaRegion] = useState(true);
  const [resultado, setResultado] = useState<SimulacionResult | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [errorDni, setErrorDni] = useState("");
  const [iesGrupos, setIesGrupos] = useState<IESGrupo[]>([]);
  const [visitCount, setVisitCount] = useState(0);
  const animatedVisits = useCountUp(visitCount, 1500);

  // Leer contador al cargar
  useEffect(() => {
    fetch("/api/visitas")
      .then((r) => r.json())
      .then((d) => setVisitCount(d.count || 557))
      .catch(() => setVisitCount(557));
  }, []);

  // Cargar persona si viene DNI en URL
  useEffect(() => {
    if (dniParam && /^\d{7,8}$/.test(dniParam)) {
      buscarDni(dniParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dniParam]);

  async function buscarDni(d: string) {
    if (!/^\d{7,8}$/.test(d)) {
      setErrorDni("Ingresa un DNI valido (7-8 digitos)");
      return;
    }
    setBuscandoDni(true);
    setErrorDni("");
    try {
      const res = await fetch(`/api/resultado/${d}`);
      const data = await res.json();
      if (data.tipo === "preseleccionado") {
        setPersona({
          dni: data.datos.dni,
          nombre: data.datos.apellidos_nombres,
          modalidad: data.datos.modalidad,
          region: data.datos.region,
          puntaje_enp: data.datos.puntaje_enp,
          condiciones_priorizables: data.datos.condiciones_priorizables,
        });
      } else {
        setErrorDni("Este DNI no es de un preseleccionado. El simulador es solo para preseleccionados.");
        setPersona(null);
      }
    } catch {
      setErrorDni("Error al buscar. Intenta de nuevo.");
    }
    setBuscandoDni(false);
  }

  // Step 2a: Filter IES names
  const iesNamesFiltered = useMemo(() => {
    if (iesNameQuery.length < 2 || selectedIESName) return [];
    const q = iesNameQuery.toUpperCase();
    return iesNames.filter((i) => i.name.includes(q));
  }, [iesNameQuery, selectedIESName]);

  useEffect(() => { setIesHighlighted(-1); }, [iesNamesFiltered]);

  function selectIESName(name: string) {
    setSelectedIESName(name);
    setIesNameQuery(name);
    setIesHighlighted(-1);
    // Reset carrera when IES changes
    setCarreraQuery("");
    setSelectedProg(null);
  }

  function handleIesKeyDown(e: React.KeyboardEvent) {
    if (iesNamesFiltered.length === 0 || selectedIESName) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setIesHighlighted((h) => Math.min(h + 1, iesNamesFiltered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIesHighlighted((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && iesHighlighted >= 0) { e.preventDefault(); selectIESName(iesNamesFiltered[iesHighlighted].name); }
  }

  useEffect(() => {
    if (iesHighlighted >= 0 && iesDropdownRef.current) {
      iesDropdownRef.current.querySelectorAll("button")[iesHighlighted]?.scrollIntoView({ block: "nearest" });
    }
  }, [iesHighlighted]);

  // Step 2b: Filter carreras of selected IES
  const carrerasFiltered = useMemo(() => {
    if (!selectedIESName || selectedProg) return [];
    const progs = iesData[selectedIESName]?.progs || [];
    if (carreraQuery.length < 1) return progs;
    const q = carreraQuery.toUpperCase();
    return progs.filter((p) => p.p.includes(q) || p.d.includes(q) || p.s.includes(q));
  }, [selectedIESName, carreraQuery, selectedProg]);

  useEffect(() => { setCarreraHighlighted(-1); }, [carrerasFiltered]);

  function selectCarrera(prog: typeof iesData[string]["progs"][number]) {
    if (!selectedIESName) return;
    const info = iesData[selectedIESName];
    setSelectedProg({
      id: prog.id,
      ies: selectedIESName,
      programa_academico: prog.p,
      tipo_ies: info.ti,
      tipo_gestion: info.tg,
      departamento: prog.d,
      sede_distrito: prog.s,
    });
    setCarreraQuery(prog.p);
    setCarreraHighlighted(-1);
  }

  function handleCarreraKeyDown(e: React.KeyboardEvent) {
    if (carrerasFiltered.length === 0 || selectedProg) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCarreraHighlighted((h) => Math.min(h + 1, carrerasFiltered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCarreraHighlighted((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && carreraHighlighted >= 0) { e.preventDefault(); selectCarrera(carrerasFiltered[carreraHighlighted]); }
  }

  useEffect(() => {
    if (carreraHighlighted >= 0 && carreraDropdownRef.current) {
      carreraDropdownRef.current.querySelectorAll("button")[carreraHighlighted]?.scrollIntoView({ block: "nearest" });
    }
  }, [carreraHighlighted]);

  async function simular() {
    if (!persona || !selectedProg) return;
    setSimulando(true);
    try {
      const res = await fetch("/api/simulador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dni: persona.dni,
          ies_id: selectedProg.id,
          misma_region: mismaRegion,
        }),
      });
      const data = await res.json();
      setResultado(data);
      // Registrar uso del simulador y actualizar contador en vivo
      fetch("/api/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "simulador" }),
      })
        .then((r) => r.json())
        .then((d) => { if (d.count) setVisitCount(d.count); })
        .catch(() => {});
      if (iesGrupos.length === 0) {
        fetch("/api/ies-grupos")
          .then((r) => r.json())
          .then((d) => setIesGrupos(d.grupos || []))
          .catch(() => {});
      }
    } catch {
      setResultado(null);
    }
    setSimulando(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold">
          Simulador de Seleccion
        </h1>
        {visitCount > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            {animatedVisits.toLocaleString()} usos
          </span>
        )}
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">
        Estima tu puntaje de seleccion eligiendo tu IES y carrera preferida.
      </p>

      {/* Paso 1: DNI */}
      <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 md:p-6 mb-4">
        <h2 className="font-semibold mb-3">1. Ingresa tu DNI</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
            onKeyDown={(e) => { if (e.key === "Enter") buscarDni(dni); }}
            placeholder="DNI de 7-8 digitos"
            className="flex-1 border border-gray-300 dark:border-input-border dark:bg-muted-bg dark:text-foreground rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => buscarDni(dni)}
            disabled={buscandoDni}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
          >
            {buscandoDni ? "Buscando..." : "Buscar"}
          </button>
        </div>
        {errorDni && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{errorDni}</p>}

        {persona && (
          <div className="mt-4 bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-sm">
            <p className="font-semibold text-green-800 dark:text-green-300">{persona.nombre}</p>
            <p className="text-green-700 dark:text-green-400">
              {persona.modalidad} | {persona.region} | ENP: {persona.puntaje_enp}{" "}
              | CP: {persona.condiciones_priorizables}
            </p>
          </div>
        )}
      </div>

      {/* Paso 2: IES + Carrera */}
      {persona && (
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 md:p-6 mb-4">
          <h2 className="font-semibold mb-4">
            2. Selecciona tu IES y carrera
          </h2>

          {/* 2a: Selecciona IES */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block font-medium">
              Primero, elige tu universidad o instituto
            </label>
            <div className="relative">
              <input
                type="text"
                value={iesNameQuery}
                onChange={(e) => {
                  setIesNameQuery(e.target.value);
                  setSelectedIESName(null);
                  setCarreraQuery("");
                  setSelectedProg(null);
                }}
                onKeyDown={handleIesKeyDown}
                placeholder="Busca por nombre de universidad o instituto..."
                className="w-full border border-gray-300 dark:border-input-border dark:bg-muted-bg dark:text-foreground rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
              {iesNamesFiltered.length > 0 && !selectedIESName && (
                <div
                  ref={iesDropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto z-10"
                >
                  {iesNamesFiltered.map((ies, i) => (
                    <button
                      key={ies.name}
                      onClick={() => selectIESName(ies.name)}
                      className={`w-full text-left px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer ${
                        i === iesHighlighted
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : "hover:bg-blue-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {ies.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {ies.ti} | {ies.tg} | {ies.progCount} carreras
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedIESName && (
              <div className="mt-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2.5 text-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-800 dark:text-blue-300">{selectedIESName}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {iesData[selectedIESName]?.ti} | {iesData[selectedIESName]?.tg} | {iesData[selectedIESName]?.progs.length} carreras disponibles
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedIESName(null);
                    setIesNameQuery("");
                    setCarreraQuery("");
                    setSelectedProg(null);
                  }}
                  className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-xs shrink-0 ml-2 cursor-pointer"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          {/* 2b: Selecciona Carrera */}
          <div>
            <label className={`text-sm mb-1.5 block font-medium ${selectedIESName ? "text-gray-600 dark:text-gray-400" : "text-gray-400 dark:text-gray-600"}`}>
              Ahora, elige tu carrera
            </label>
            <div className="relative">
              <input
                type="text"
                value={carreraQuery}
                onChange={(e) => {
                  setCarreraQuery(e.target.value);
                  setSelectedProg(null);
                }}
                onKeyDown={handleCarreraKeyDown}
                disabled={!selectedIESName}
                placeholder={selectedIESName ? "Busca tu carrera..." : "Primero selecciona una IES arriba"}
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none ${
                  selectedIESName
                    ? "border-gray-300 dark:border-input-border dark:bg-muted-bg dark:text-foreground focus:border-blue-500"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                }`}
              />
              {carrerasFiltered.length > 0 && !selectedProg && selectedIESName && (
                <div
                  ref={carreraDropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto z-10"
                >
                  {carrerasFiltered.map((prog, i) => (
                    <button
                      key={prog.id}
                      onClick={() => selectCarrera(prog)}
                      className={`w-full text-left px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer ${
                        i === carreraHighlighted
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : "hover:bg-blue-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {prog.p}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {prog.d} | {prog.s}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedProg && (
              <div className="mt-2 bg-green-50 dark:bg-green-950/30 rounded-lg p-2.5 text-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">{selectedProg.programa_academico}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {selectedProg.departamento} | {selectedProg.sede_distrito} | {selectedProg.tipo_gestion}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedProg(null); setCarreraQuery(""); }}
                  className="text-green-400 hover:text-green-600 dark:hover:text-green-300 text-xs shrink-0 ml-2 cursor-pointer"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paso 3: Region */}
      {persona && selectedProg && (
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 md:p-6 mb-4">
          <h2 className="font-semibold mb-3">
            3. ¿Estudiaras en tu misma region?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Tu region: {persona.region} | IES en: {selectedProg.departamento}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setMismaRegion(true)}
              className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition-colors cursor-pointer ${
                mismaRegion
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              Si, misma region
              <span className="block text-xs font-normal mt-1">
                Permanencia Regional
              </span>
            </button>
            <button
              onClick={() => setMismaRegion(false)}
              className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition-colors cursor-pointer ${
                !mismaRegion
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              No, otra region
              <span className="block text-xs font-normal mt-1">
                Movilidad Estudiantil
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Boton simular */}
      {persona && selectedProg && (
        <div className="text-center mb-6">
          <button
            onClick={simular}
            disabled={simulando}
            className="bg-amber-500 text-white px-10 py-3 rounded-xl font-bold text-lg hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-lg cursor-pointer"
          >
            {simulando ? "Calculando..." : "Simular Puntaje"}
          </button>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 p-4 md:p-6">
            <h2 className="font-bold text-xl mb-4 text-center">
              Tu Puntaje Estimado de Seleccion
            </h2>

            <PuntajeAnimado value={resultado.puntaje_seleccion} />

            {/* Desglose COMPLETO - los 7 criterios de la Tabla 14 */}
            <div className="bg-white dark:bg-card rounded-xl p-4 md:p-6 mb-4">
              <h3 className="font-bold mb-1">¿De donde sale tu puntaje?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Los 7 criterios de la Tabla 14 de las Bases. Todos se suman para obtener tu puntaje de seleccion.</p>

              {/* Seccion A */}
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">A: Tu examen y condiciones (ya los tienes)</p>
              <div className="space-y-4 mb-5">
                <DesgloseItem
                  label="Tu nota del examen (ENP)"
                  ayuda="Es la nota que sacaste en el Examen Nacional de Preseleccion. Son 60 preguntas de mate y comprension lectora, cada una vale 2 puntos."
                  value={resultado.desglose.enp}
                  max={120}
                />
                <DesgloseItem
                  label={`Condiciones priorizables (${resultado.desglose.cp_original} pts x 0.5)`}
                  ayuda={`En preseleccion obtuviste ${resultado.desglose.cp_original} puntos por condiciones priorizables (discapacidad, orfandad, victima de violencia, lengua originaria, etc). En la etapa de seleccion este puntaje se multiplica por 0.5, entonces: ${resultado.desglose.cp_original} x 0.5 = ${resultado.desglose.pcp} puntos.`}
                  value={resultado.desglose.pcp}
                  max={20}
                />
              </div>

              {/* Seccion B */}
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wide">B: La IES y carrera que elijas (depende de tu eleccion)</p>
              <div className="space-y-4">
                <DesgloseItem
                  label={`Calidad de la IES — Grupo ${resultado.desglose.clasificacion_grupo} (C)`}
                  ayuda={`${resultado.ies.nombre} esta clasificada en el Grupo ${resultado.desglose.clasificacion_grupo} por PRONABEC. Grupo 1 = 10 pts (las mejores), Grupo 2 = 8 pts (buena calidad), Grupo 3 = 6 pts (solo universidades). Ver lista completa abajo.`}
                  value={resultado.desglose.clasificacion_ies}
                  max={10}
                />
                <DesgloseItem
                  label={resultado.ies.tipo_gestion === "PUBLICA" ? "Es publica (G)" : "Es privada (G)"}
                  ayuda="Si eliges una universidad o instituto publico te dan 10 puntos. Si es privada solo 5. PRONABEC prioriza la educacion publica."
                  value={resultado.desglose.gestion_ies}
                  max={10}
                />
                <DesgloseItem
                  label={`${resultado.desglose.pr_me_tipo === 'PR' ? 'Estudias en tu region' : 'Te mudas a otra region'} — Quintil ${resultado.desglose.pr_me_quintil} (${resultado.desglose.pr_me_tipo})`}
                  ayuda={resultado.desglose.pr_me_tipo === 'PR'
                    ? `Como vas a estudiar en tu misma region, te dan puntos por 'Permanencia Regional'. Tu region esta en el Quintil ${resultado.desglose.pr_me_quintil} de pobreza: Q1 = 10 pts, Q2 = 8 pts, Q3 = 6 pts, Q4 = 4 pts.`
                    : `Como te mudas a otra region para estudiar, te dan puntos por 'Movilidad Estudiantil'. La region donde vas esta en el Quintil ${resultado.desglose.pr_me_quintil}: Q1 = 10 pts, Q2 = 8 pts, Q3 = 6 pts, Q4 = 4 pts.`
                  }
                  value={resultado.desglose.pr_me}
                  max={10}
                />
                <DesgloseItem
                  label={`Carrera de alta demanda EDO (EST)${resultado.desglose.est > 0 ? ' — ' + resultado.desglose.est_campo_edo : ''}`}
                  ayuda={resultado.desglose.est_razon}
                  value={resultado.desglose.est}
                  max={10}
                />
                <DesgloseItem
                  label="Carrera de Educacion/Pedagogia (EP)"
                  ayuda={resultado.desglose.ep_razon}
                  value={resultado.desglose.ep}
                  max={10}
                />
              </div>

              <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 text-xs text-gray-500 dark:text-gray-400">
                <strong>Nota:</strong> EST y EP no se suman entre si. Si aplican ambos, se usa el mayor (en tu caso se suma {resultado.desglose.est_ep_usado} pts).
                {resultado.desglose.est === 0 && resultado.desglose.ep === 0 && (
                  <span> Ninguno aplica para tu combinacion actual de IES, carrera y modalidad.</span>
                )}
              </div>
            </div>

            {/* Sugerencia */}
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <h3 className="font-semibold text-sm mb-2 text-amber-800 dark:text-amber-300">
                Consejos para subir tu puntaje
              </h3>
              <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                {resultado.ies.tipo_gestion === "PRIVADA" && (
                  <li>Si eliges una universidad <strong>publica</strong> en vez de privada, ganarias <strong>5 puntos mas</strong> (10 en vez de 5).</li>
                )}
                {resultado.ies.tipo_gestion === "PUBLICA" && (
                  <li>Bien: elegiste una IES publica, ya tienes el maximo de 10 puntos por gestion.</li>
                )}
                {resultado.desglose.pr_me < 10 && (
                  <li>Si estudias en una region con mas pobreza (quintil 1), obtendrias <strong>10 puntos</strong> en vez de {resultado.desglose.pr_me} por region.</li>
                )}
                {resultado.desglose.clasificacion_ies < 10 && (
                  <li>Si eliges una IES Grupo 1 (las de mayor calidad), obtendrias <strong>10 puntos</strong> en vez de {resultado.desglose.clasificacion_ies} por clasificacion.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Tabla de referencia */}
          <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 md:p-6">
            <h3 className="font-bold mb-1">¿Como se calcula el puntaje de seleccion?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Segun la Tabla 14 de las Bases del Concurso Beca 18 - Convocatoria 2026. Puntaje maximo: 180 puntos (175 para Beca EIB).</p>

            {/* Seccion 1 */}
            <div className="mb-4">
              <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-t-lg">
                TU EXAMEN Y CONDICIONES (ya los tienes)
              </div>
              <div className="border border-t-0 border-gray-200 dark:border-card-border rounded-b-lg divide-y divide-gray-100 dark:divide-gray-700">
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">Examen (ENP)</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tu nota del examen de preseleccion (60 preguntas x 2 pts)</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-xs text-gray-400">0-120</span>
                    <span className="ml-2 font-bold text-sm">/ 120</span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">Condiciones Priorizables (PCP)</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tus condiciones especiales multiplicadas por 0.5</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-xs text-gray-400">0-20</span>
                    <span className="ml-2 font-bold text-sm">/ 20</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seccion 2 */}
            <div className="mb-4">
              <div className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-t-lg">
                LA UNIVERSIDAD O INSTITUTO QUE ELIJAS (hasta 40 pts extra)
              </div>
              <div className="border border-t-0 border-gray-200 dark:border-card-border rounded-b-lg divide-y divide-gray-200 dark:divide-gray-700">
                {/* Calidad IES */}
                <div className="px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-medium text-sm">Calidad de la IES (C)</p>
                    <span className="font-bold text-sm shrink-0 ml-3">/ 10</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg px-2 py-1.5 text-center">
                      <p className="font-bold text-green-700 dark:text-green-400 text-sm">10</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Grupo 1<br/>Las mejores</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg px-2 py-1.5 text-center">
                      <p className="font-bold text-blue-700 dark:text-blue-400 text-sm">8</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Grupo 2<br/>Buena calidad</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1.5 text-center">
                      <p className="font-bold text-gray-600 dark:text-gray-300 text-sm">6</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Grupo 3<br/>Solo universidades</p>
                    </div>
                  </div>
                </div>

                {/* Gestion */}
                <div className="px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-medium text-sm">¿Publica o privada? (G)</p>
                    <span className="font-bold text-sm shrink-0 ml-3">/ 10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg px-2 py-1.5 text-center">
                      <p className="font-bold text-green-700 dark:text-green-400 text-sm">10</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Publica (del Estado)</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1.5 text-center">
                      <p className="font-bold text-gray-600 dark:text-gray-300 text-sm">5</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Privada</p>
                    </div>
                  </div>
                </div>

                {/* Region */}
                <div className="px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-medium text-sm">¿Donde vas a estudiar? (PR o ME)</p>
                    <span className="font-bold text-sm shrink-0 ml-3">/ 10</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg px-1 py-1.5 text-center">
                      <p className="font-bold text-green-700 dark:text-green-400 text-sm">10</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Quintil 1<br/>Muy pobre</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg px-1 py-1.5 text-center">
                      <p className="font-bold text-blue-700 dark:text-blue-400 text-sm">8</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Quintil 2<br/>Pobre</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg px-1 py-1.5 text-center">
                      <p className="font-bold text-yellow-700 dark:text-yellow-400 text-sm">6</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Quintil 3<br/>Intermedia</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-1 py-1.5 text-center">
                      <p className="font-bold text-gray-600 dark:text-gray-300 text-sm">4</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Quintil 4<br/>Lima, etc.</p>
                    </div>
                  </div>
                </div>

                {/* Carrera demanda */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">Carrera tecnica de alta demanda (EST)</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Solo si estudias en instituto tecnologico y tu carrera es muy pedida por empresas</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="font-bold text-sm">10 / 10</span>
                  </div>
                </div>

                {/* Carrera educacion */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">Carrera de educacion (EP)</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Solo si eres BEAHD (hijo de docente) y eliges carrera de educacion/pedagogia</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="font-bold text-sm">10 / 10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="bg-blue-600 text-white rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="font-bold text-sm">PUNTAJE MAXIMO TOTAL</span>
              <span className="font-bold text-xl">180</span>
            </div>

            {/* Notas al pie */}
            <div className="mt-4 space-y-2">
              <details className="group">
                <summary className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  + ¿Como se calcula? (formula)
                </summary>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-3">
                  Puntaje = ENP + (Cond. Priorizables x 0.5) + Calidad IES + Publica/Privada + Region + (Carrera demanda o Educacion)
                </p>
              </details>
              <details className="group">
                <summary className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  + ¿Que son los Grupos de IES?
                </summary>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-3">
                  PRONABEC clasifica las universidades e institutos en grupos segun indicadores de empleabilidad, investigacion, ensenanza y desempeno academico. Grupo 1 son las mejores. El Grupo 3 aplica solo para universidades.
                </p>
              </details>
              <details className="group">
                <summary className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  + ¿Que carreras dan 10 puntos extra por alta demanda (EST)?
                </summary>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pl-3 space-y-2">
                  <p>Solo aplica si estudias en un <strong>instituto o escuela tecnologica</strong> (no universidades). Tu carrera debe estar en uno de estos 10 campos segun la Encuesta de Demanda Ocupacional (EDO) del Ministerio de Trabajo:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {[
                      { n: 1, campo: "Mecanica y Metalurgica", ejemplos: "Mecanica automotriz, soldadura, mantenimiento de maquinaria pesada" },
                      { n: 2, campo: "Gestion y Administracion", ejemplos: "Administracion de empresas, negocios, gestion empresarial" },
                      { n: 3, campo: "Contabilidad e Impuestos", ejemplos: "Contabilidad general, tecnica contable" },
                      { n: 4, campo: "Electricidad y Energia", ejemplos: "Electricidad industrial, electrotecnia, electronica, energia renovable" },
                      { n: 5, campo: "Sistemas y Computo", ejemplos: "Computacion, desarrollo de software, redes, programacion" },
                      { n: 6, campo: "Marketing y Publicidad", ejemplos: "Marketing digital, publicidad, mercadotecnia" },
                      { n: 7, campo: "Enfermeria", ejemplos: "Enfermeria tecnica" },
                      { n: 8, campo: "Construccion e Ing. Civil", ejemplos: "Construccion civil, topografia, edificaciones" },
                      { n: 9, campo: "Hoteleria y Gastronomia", ejemplos: "Gastronomia, cocina, hoteleria, turismo, panaderia" },
                      { n: 10, campo: "Salud y Proteccion Laboral", ejemplos: "Seguridad industrial, salud ocupacional" },
                    ].map((c) => (
                      <div key={c.n} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                        <p className="font-semibold text-gray-700 dark:text-gray-200">
                          <span className="text-blue-600 dark:text-blue-400">{c.n}.</span> {c.campo}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{c.ejemplos}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2"><strong>Fuente:</strong> Anexo N.05 de las Bases, Encuesta de Demanda Ocupacional (MTPE).</p>
                </div>
              </details>
              <details className="group">
                <summary className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  + ¿Que regiones estan en cada quintil?
                </summary>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-3 space-y-0.5">
                  <p><strong>Quintil 1</strong> (mas pobres): Cajamarca, Huancavelica, Ayacucho, Apurimac, Huanuco, Amazonas, Loreto, Pasco.</p>
                  <p><strong>Quintil 2:</strong> Puno, San Martin, Cusco, Piura, Ucayali, Ancash, Junin.</p>
                  <p><strong>Quintil 3:</strong> La Libertad, Lambayeque, Tumbes, Madre de Dios, Ica, Tacna.</p>
                  <p><strong>Quintil 4:</strong> Moquegua, Arequipa, Lima, Callao.</p>
                </div>
              </details>
              <details className="group">
                <summary className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  + ¿Que es PR y ME?
                </summary>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-3 space-y-0.5">
                  <p><strong>Permanencia Regional (PR):</strong> Si estudias en la misma region donde terminaste el colegio. El puntaje depende del quintil de pobreza de tu region.</p>
                  <p><strong>Movilidad Estudiantil (ME):</strong> Si te mudas a otra region para estudiar. El puntaje depende del quintil de la region donde vas. No puedes sumar PR y ME a la vez.</p>
                </div>
              </details>
            </div>
          </div>

          {/* Lista de IES por grupo */}
          {iesGrupos.length > 0 && (
            <ListaIESPorGrupo iesGrupos={iesGrupos} />
          )}
        </div>
      )}
    </div>
  );
}

function PuntajeAnimado({ value }: { value: number }) {
  const animated = useCountUp(value, 1000);
  return (
    <div className="text-center mb-6">
      <span className="text-5xl md:text-6xl font-bold text-blue-700 dark:text-blue-400">
        {animated}
      </span>
      <span className="text-gray-500 dark:text-gray-400 text-lg ml-2">/ 180</span>
    </div>
  );
}

function DesgloseItem({
  label,
  ayuda,
  value,
  max,
}: {
  label: string;
  ayuda?: string;
  value: number;
  max: number;
}) {
  const [abierto, setAbierto] = useState(false);
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex justify-between mb-1 items-center">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-gray-700 dark:text-gray-200 font-medium text-sm">{label}</span>
          {ayuda && (
            <button
              onClick={() => setAbierto(!abierto)}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0 w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 hover:border-blue-400 flex items-center justify-center text-xs font-bold leading-none cursor-pointer"
              title={abierto ? "Cerrar detalle" : "Ver detalle"}
            >
              {abierto ? "−" : "+"}
            </button>
          )}
        </div>
        <span className="font-bold text-blue-700 dark:text-blue-400 shrink-0 ml-2 text-sm">
          {value} / {max}
        </span>
      </div>
      {abierto && ayuda && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 leading-relaxed">{ayuda}</p>
      )}
      <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-blue-500 h-full rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const TIPO_LABELS: Record<string, string> = {
  "UNIVERSIDAD": "Universidades",
  "ESCUELA DE EDUCACION SUPERIOR PEDAGOGICA": "Escuelas Pedagogicas (EESP)",
  "ESCUELA DE EDUCACION SUPERIOR TECNOLOGICA": "Escuelas Tecnologicas (EEST)",
  "INSTITUTO DE EDUCACION SUPERIOR TECNOLOGICA": "Institutos Tecnologicos (IEST)",
};

const GRUPO_CONFIG = [
  { grupo: 1, puntos: 10, label: "Grupo 1", color: "bg-green-600", badge: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300", desc: "Las mejores del pais — 10 puntos" },
  { grupo: 2, puntos: 8, label: "Grupo 2", color: "bg-blue-600", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", desc: "Buena calidad — 8 puntos" },
  { grupo: 3, puntos: 6, label: "Grupo 3", color: "bg-gray-500", badge: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300", desc: "Solo universidades — 6 puntos" },
];

function ListaIESPorGrupo({ iesGrupos }: { iesGrupos: IESGrupo[] }) {
  const [grupoAbierto, setGrupoAbierto] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-card-border p-4 md:p-6">
      <h3 className="font-bold mb-1">¿Que universidades e institutos estan en cada grupo?</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Clasificacion oficial de PRONABEC segun indicadores de calidad. Todas las EESP y EEST van automaticamente al Grupo 1.
      </p>

      <div className="space-y-3">
        {GRUPO_CONFIG.map((gc) => {
          const iesDelGrupo = iesGrupos.filter((i) => i.grupo === gc.grupo);
          if (iesDelGrupo.length === 0) return null;

          const abierto = grupoAbierto === gc.grupo;

          const porTipo: Record<string, IESGrupo[]> = {};
          iesDelGrupo.forEach((i) => {
            if (!porTipo[i.tipo_ies]) porTipo[i.tipo_ies] = [];
            if (!porTipo[i.tipo_ies].find((x) => x.ies === i.ies)) {
              porTipo[i.tipo_ies].push(i);
            }
          });

          const tiposDisponibles = Object.keys(porTipo);
          const tipoActual = filtroTipo === "todos" || !porTipo[filtroTipo] ? "todos" : filtroTipo;

          return (
            <div key={gc.grupo} className="border border-gray-200 dark:border-card-border rounded-lg overflow-hidden">
              <button
                onClick={() => setGrupoAbierto(abierto ? null : gc.grupo)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className={`${gc.color} text-white text-xs font-bold px-2.5 py-1 rounded`}>
                    {gc.puntos} pts
                  </span>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{gc.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{gc.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {Object.values(porTipo).reduce((acc, arr) => acc + arr.length, 0)} IES
                  </span>
                  <span className="text-gray-400 w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs font-bold">
                    {abierto ? "−" : "+"}
                  </span>
                </div>
              </button>

              {abierto && (
                <div className="border-t border-gray-200 dark:border-card-border px-4 py-3">
                  {tiposDisponibles.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <button
                        onClick={() => setFiltroTipo("todos")}
                        className={`text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                          tipoActual === "todos"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        Todos
                      </button>
                      {tiposDisponibles.map((tipo) => (
                        <button
                          key={tipo}
                          onClick={() => setFiltroTipo(tipo)}
                          className={`text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                            tipoActual === tipo
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          {TIPO_LABELS[tipo] || tipo} ({porTipo[tipo].length})
                        </button>
                      ))}
                    </div>
                  )}

                  {(tipoActual === "todos" ? tiposDisponibles : [tipoActual]).map((tipo) => (
                    <div key={tipo} className="mb-3 last:mb-0">
                      {tipoActual === "todos" && (
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          {TIPO_LABELS[tipo] || tipo} ({porTipo[tipo].length})
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {porTipo[tipo].map((ies) => (
                          <div
                            key={ies.ies}
                            className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-xs"
                          >
                            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              ies.tipo_gestion === "PUBLICA"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                            }`}>
                              {ies.tipo_gestion === "PUBLICA" ? "PUB" : "PRIV"}
                            </span>
                            <span className="text-gray-700 dark:text-gray-300 truncate">{ies.ies}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 mt-3">
        Fuente: PRONABEC - Clasificacion de IES segun priorizacion, Convocatoria 2026.
      </p>
    </div>
  );
}
