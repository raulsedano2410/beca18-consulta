import { NextRequest, NextResponse } from 'next/server';
import iesData from '@/lib/data/ies.json';

const DEPARTAMENTOS = [
  'AMAZONAS', 'ANCASH', 'APURIMAC', 'AREQUIPA', 'AYACUCHO', 'CAJAMARCA',
  'CALLAO', 'CUSCO', 'HUANCAVELICA', 'HUANUCO', 'ICA', 'JUNIN',
  'LA LIBERTAD', 'LAMBAYEQUE', 'LIMA', 'LORETO', 'MADRE DE DIOS',
  'MOQUEGUA', 'PASCO', 'PIURA', 'PUNO', 'SAN MARTIN', 'TACNA', 'TUMBES', 'UCAYALI',
];

const TIPOS_IES = [
  'ESCUELA DE EDUCACION SUPERIOR PEDAGOGICA',
  'ESCUELA DE EDUCACION SUPERIOR TECNOLOGICA',
  'INSTITUTO DE EDUCACION SUPERIOR TECNOLOGICA',
  'UNIVERSIDAD',
];

type IESRow = typeof iesData[number];

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get('q')?.trim();
  const depto = sp.get('departamento');
  const tipo = sp.get('tipo_ies');
  const gestion = sp.get('gestion');
  const page = parseInt(sp.get('page') || '1');
  const limit = 50;

  let filtered: IESRow[] = iesData;

  if (q && q.length >= 2) {
    const qUp = q.toUpperCase();
    filtered = filtered.filter(
      (r) => r.ies.toUpperCase().includes(qUp) || r.programa_academico.toUpperCase().includes(qUp)
    );
  }
  if (depto) {
    filtered = filtered.filter((r) => r.departamento === depto);
  }
  if (tipo) {
    filtered = filtered.filter((r) => r.tipo_ies === tipo);
  }
  if (gestion) {
    filtered = filtered.filter((r) => r.tipo_gestion === gestion);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const from = (page - 1) * limit;
  const data = filtered.slice(from, from + limit);

  return NextResponse.json({
    ies: data,
    total,
    page,
    totalPages,
    filtros: {
      departamentos: DEPARTAMENTOS,
      tipos_ies: TIPOS_IES,
    },
  });
}
