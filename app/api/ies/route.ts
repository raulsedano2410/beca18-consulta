import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get('q')?.trim();
  const depto = sp.get('departamento');
  const tipo = sp.get('tipo_ies');
  const gestion = sp.get('gestion');
  const page = parseInt(sp.get('page') || '1');
  const limit = 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build query
  let query = supabase.from('ies_elegibles').select('*', { count: 'exact' });

  if (q && q.length >= 2) {
    query = query.or(`ies.ilike.%${q}%,programa_academico.ilike.%${q}%`);
  }
  if (depto) {
    query = query.eq('departamento', depto);
  }
  if (tipo) {
    query = query.eq('tipo_ies', tipo);
  }
  if (gestion) {
    query = query.eq('tipo_gestion', gestion);
  }

  const { data, count } = await query
    .order('ies')
    .order('programa_academico')
    .range(from, to);

  // Filters (distinct values)
  const { data: deptos } = await supabase
    .from('ies_elegibles')
    .select('departamento')
    .order('departamento');
  const { data: tipos } = await supabase
    .from('ies_elegibles')
    .select('tipo_ies')
    .order('tipo_ies');

  const uniqueDeptos = [...new Set((deptos || []).map((d) => d.departamento))];
  const uniqueTipos = [...new Set((tipos || []).map((t) => t.tipo_ies))];

  const total = count || 0;

  return NextResponse.json({
    ies: data || [],
    total,
    page,
    totalPages: Math.ceil(total / limit),
    filtros: {
      departamentos: uniqueDeptos,
      tipos_ies: uniqueTipos,
    },
  });
}
