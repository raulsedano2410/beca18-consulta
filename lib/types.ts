export interface Preseleccionado {
  id: number;
  numero: number;
  modalidad: string;
  dni: string;
  apellidos_nombres: string;
  region: string;
  puntaje_enp: number;
  condiciones_priorizables: number;
  caracteristicas_labor_docente: number | null;
  puntaje_final: number;
  resultado: string;
}

export interface NoPreseleccionado {
  id: number;
  numero: number;
  modalidad: string;
  dni: string;
  apellidos_nombres: string;
  region: string;
  puntaje_enp: number;
  condiciones_priorizables: number;
  puntaje_final: number;
  resultado: string;
}

export interface Descalificado {
  id: number;
  numero: number;
  modalidad: string;
  dni: string;
  apellidos_nombres: string;
  condicion: string;
  causal: string;
}

export interface PuntajeCorte {
  modalidad: string;
  min_preseleccionado: number;
  max_preseleccionado: number;
  avg_preseleccionado: number;
  max_no_preseleccionado: number;
  vacantes_preseleccion: number;
  becas_disponibles: number;
}

export interface CausalDescalificacion {
  causal_codigo: string;
  causal_descripcion: string;
  cantidad: number;
}

export interface IESElegible {
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

export interface ResultadoBusqueda {
  tipo: 'preseleccionado' | 'no_preseleccionado' | 'descalificado';
  datos: Preseleccionado | NoPreseleccionado | Descalificado;
  ranking_global?: number;
  total_modalidad?: number;
  ranking_regional?: number;
  total_region?: number;
  percentil?: number;
  mismo_puntaje_global?: number;
  mismo_puntaje_regional?: number;
  corte?: PuntajeCorte;
  causal_descripcion?: string;
}

export interface EstadisticasModalidad {
  modalidad: string;
  total_preseleccionados: number;
  total_no_preseleccionados: number;
  total_descalificados: number;
  puntaje_min: number;
  puntaje_max: number;
  puntaje_avg: number;
  distribucion: { puntaje: number; cantidad: number }[];
}
