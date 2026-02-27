import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 10 campos de alta demanda segun EDO (profesionales tecnicos)
const CAMPOS_EDO_TECNICOS: { campo: string; keywords: string[] }[] = [
  { campo: 'Mecanica y Metalurgica', keywords: ['MECANICA', 'METALURGIA', 'SOLDADURA', 'AUTOMOTRIZ', 'MANTENIMIENTO DE MAQUINARIA'] },
  { campo: 'Gestion y Administracion', keywords: ['ADMINISTRACION', 'GESTION', 'NEGOCIOS'] },
  { campo: 'Contabilidad e Impuestos', keywords: ['CONTABILIDAD', 'CONTABLE'] },
  { campo: 'Electricidad y Energia', keywords: ['ELECTRICIDAD', 'ELECTROTECNIA', 'ELECTRONICA', 'ENERGIA', 'ELECTRICA'] },
  { campo: 'Sistemas y Computo', keywords: ['COMPUTACION', 'INFORMATICA', 'SOFTWARE', 'SISTEMAS', 'REDES', 'PROGRAMACION', 'DESARROLLO DE APLICACIONES'] },
  { campo: 'Marketing y Publicidad', keywords: ['MARKETING', 'PUBLICIDAD', 'MERCADOTECNIA'] },
  { campo: 'Enfermeria', keywords: ['ENFERMERIA'] },
  { campo: 'Construccion e Ingenieria Civil', keywords: ['CONSTRUCCION', 'TOPOGRAFIA', 'EDIFICACIONES'] },
  { campo: 'Hoteleria, Restaurantes y Gastronomia', keywords: ['GASTRONOMIA', 'COCINA', 'HOTELERIA', 'TURISMO', 'RESTAURANTE', 'PANADERIA', 'PASTELERIA'] },
  { campo: 'Salud y Proteccion Laboral', keywords: ['SEGURIDAD', 'SALUD OCUPACIONAL', 'PROTECCION', 'SEGURIDAD INDUSTRIAL', 'SEGURIDAD Y SALUD'] },
];

function detectarCampoEDO(programa: string): { aplica: boolean; campo: string | null } {
  const prog = programa.toUpperCase();
  for (const c of CAMPOS_EDO_TECNICOS) {
    if (c.keywords.some(k => prog.includes(k))) {
      return { aplica: true, campo: c.campo };
    }
  }
  return { aplica: false, campo: null };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { dni, ies_id, misma_region } = body;

  if (!dni || !ies_id) {
    return NextResponse.json({ error: 'DNI e IES requeridos' }, { status: 400 });
  }

  // Obtener datos del preseleccionado
  const { data: preData } = await supabase
    .from('preseleccionados')
    .select('*')
    .eq('dni', dni)
    .limit(1);

  if (!preData || preData.length === 0) {
    return NextResponse.json({ error: 'DNI no encontrado en preseleccionados' }, { status: 404 });
  }
  const persona = preData[0];

  // Obtener datos de la IES elegida
  const { data: iesData } = await supabase
    .from('ies_elegibles')
    .select('*')
    .eq('item', ies_id)
    .limit(1);

  if (!iesData || iesData.length === 0) {
    return NextResponse.json({ error: 'IES no encontrada' }, { status: 404 });
  }
  const ies = iesData[0];

  // === CALCULAR PUNTAJE DE SELECCION ===

  const enp = persona.puntaje_enp;
  const cp = persona.condiciones_priorizables;
  const pcp = Math.min(cp * 0.5, 20);

  // C = Clasificacion IES
  const grupoMap: Record<number, number> = { 1: 10, 2: 8, 3: 6 };
  const c = grupoMap[ies.grupo] || 8;

  // G = Gestion IES
  const g = ies.tipo_gestion === 'PUBLICA' ? 10 : 5;

  // PR o ME
  const quintilesRegion: Record<string, number> = {
    'CAJAMARCA': 1, 'HUANCAVELICA': 1, 'AYACUCHO': 1, 'APURIMAC': 1, 'HUANUCO': 1,
    'AMAZONAS': 1, 'LORETO': 1, 'PASCO': 1, 'PUNO': 2, 'SAN MARTIN': 2,
    'CUSCO': 2, 'PIURA': 2, 'UCAYALI': 2, 'ANCASH': 2, 'JUNIN': 2,
    'LA LIBERTAD': 3, 'LAMBAYEQUE': 3, 'TUMBES': 3, 'MADRE DE DIOS': 3,
    'ICA': 3, 'TACNA': 3, 'MOQUEGUA': 4,
    'AREQUIPA': 4, 'LIMA': 4, 'CALLAO': 4,
  };
  const puntajeQuintil: Record<number, number> = { 1: 10, 2: 8, 3: 6, 4: 4 };

  let prMe = 4;
  let quintilUsado = 4;
  if (misma_region) {
    quintilUsado = quintilesRegion[persona.region] || 4;
    prMe = puntajeQuintil[quintilUsado];
  } else {
    quintilUsado = quintilesRegion[ies.departamento] || 4;
    prMe = puntajeQuintil[quintilUsado];
  }

  // EST
  const esIESTecnologica = ies.tipo_ies === 'INSTITUTO DE EDUCACION SUPERIOR TECNOLOGICA'
    || ies.tipo_ies === 'ESCUELA DE EDUCACION SUPERIOR TECNOLOGICA';
  const edoResult = detectarCampoEDO(ies.programa_academico);
  let est = 0;
  let estRazon = '';
  if (!esIESTecnologica) {
    estRazon = 'Solo aplica para institutos y escuelas tecnologicas, no para universidades ni EESP.';
  } else if (edoResult.aplica) {
    est = 10;
    estRazon = `Tu carrera pertenece al campo "${edoResult.campo}", que esta en el Top 10 de alta demanda segun la Encuesta de Demanda Ocupacional (EDO) del Ministerio de Trabajo.`;
  } else {
    estRazon = 'Tu carrera no esta dentro de los 10 campos de alta demanda segun la EDO del Ministerio de Trabajo.';
  }

  // EP
  let ep = 0;
  let epRazon = '';
  const esCarreraEducacion = ies.programa_academico.includes('EDUCACION')
    || ies.programa_academico.includes('PEDAGOGIA');
  if (persona.modalidad !== 'BEAHD') {
    epRazon = 'Solo aplica para postulantes de la modalidad BEAHD (Hijos de Docentes).';
  } else if (esCarreraEducacion) {
    ep = 10;
    epRazon = 'Eres BEAHD y elegiste una carrera de Educacion/Pedagogia. Obtienes 10 puntos extra.';
  } else {
    epRazon = 'Eres BEAHD pero tu carrera elegida no es de Educacion ni Pedagogia.';
  }

  const estEp = Math.max(est, ep);
  const puntajeSeleccion = Math.round(enp + pcp + c + g + prMe + estEp);

  // Corte
  const { data: corteData } = await supabase
    .from('puntajes_corte')
    .select('*')
    .eq('modalidad', persona.modalidad)
    .limit(1);

  return NextResponse.json({
    persona: {
      dni: persona.dni,
      nombre: persona.apellidos_nombres,
      modalidad: persona.modalidad,
      region: persona.region,
      puntaje_enp: enp,
      condiciones_priorizables: cp,
    },
    ies: {
      nombre: ies.ies,
      programa: ies.programa_academico,
      tipo_ies: ies.tipo_ies,
      tipo_gestion: ies.tipo_gestion,
      departamento: ies.departamento,
      sede: ies.sede_distrito,
      grupo: ies.grupo,
    },
    desglose: {
      enp,
      cp_original: cp,
      pcp: Math.round(pcp * 10) / 10,
      clasificacion_ies: c,
      clasificacion_grupo: ies.grupo,
      gestion_ies: g,
      pr_me: prMe,
      pr_me_tipo: misma_region ? 'PR' : 'ME',
      pr_me_quintil: quintilUsado,
      est,
      est_razon: estRazon,
      est_campo_edo: edoResult.campo,
      ep,
      ep_razon: epRazon,
      est_ep_usado: estEp,
    },
    puntaje_seleccion: puntajeSeleccion,
    corte: corteData?.[0] || null,
  });
}
