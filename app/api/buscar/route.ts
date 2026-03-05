import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ resultados: [] });
  }

  const isDNI = /^\d+$/.test(q);
  const resultados: { dni: string; nombre: string; tipo: string; modalidad: string }[] = [];

  const tables = [
    { table: 'preseleccionados', tipo: 'preseleccionado' },
    { table: 'no_preseleccionados', tipo: 'no_preseleccionado' },
    { table: 'descalificados', tipo: 'descalificado' },
  ] as const;

  for (const { table, tipo } of tables) {
    let query = supabase
      .from(table)
      .select('dni, apellidos_nombres, modalidad');

    if (isDNI) {
      if (q.length >= 7) {
        query = query.eq('dni', q);
      } else {
        query = query.like('dni', `${q}%`);
      }
      query = query.limit(10);
    } else {
      query = query.ilike('apellidos_nombres', `%${q}%`)
        .order('apellidos_nombres')
        .limit(20);
    }

    const { data } = await query;
    if (data) {
      resultados.push(
        ...data.map((r) => ({
          dni: r.dni,
          nombre: r.apellidos_nombres,
          tipo,
          modalidad: r.modalidad,
        }))
      );
    }
  }

  resultados.sort((a, b) => a.nombre.localeCompare(b.nombre));
  return NextResponse.json({ resultados: resultados.slice(0, 30) });
}
