import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function fetchAll<T>(table: string, select: string): Promise<T[]> {
  const results: T[] = [];
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from(table)
      .select(select)
      .range(from, from + pageSize - 1);

    if (data && data.length > 0) {
      results.push(...(data as T[]));
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  return results;
}

export async function GET() {
  // Counts
  const { count: preCount } = await supabase.from('preseleccionados').select('*', { count: 'exact', head: true });
  const { count: nopreCount } = await supabase.from('no_preseleccionados').select('*', { count: 'exact', head: true });
  const { count: descCount } = await supabase.from('descalificados').select('*', { count: 'exact', head: true });

  // Fetch all preseleccionados (16k rows)
  const allPre = await fetchAll<{
    modalidad: string;
    puntaje_final: number;
    region: string;
    apellidos_nombres: string;
  }>('preseleccionados', 'modalidad, puntaje_final, region, apellidos_nombres');

  // Fetch all no_preseleccionados (73k rows) - only modalidad & region needed
  const allNoPre = await fetchAll<{
    modalidad: string;
    region: string;
  }>('no_preseleccionados', 'modalidad, region');

  // Aggregate preseleccionados
  const modMapPre = new Map<string, { total: number; pmin: number; pmax: number; sum: number }>();
  const regionMapPre = new Map<string, number>();
  const top10Map = new Map<string, { apellidos_nombres: string; region: string; puntaje_final: number }[]>();

  for (const r of allPre) {
    const mod = r.modalidad;
    const existing = modMapPre.get(mod) || { total: 0, pmin: 999, pmax: 0, sum: 0 };
    existing.total++;
    existing.pmin = Math.min(existing.pmin, r.puntaje_final);
    existing.pmax = Math.max(existing.pmax, r.puntaje_final);
    existing.sum += r.puntaje_final;
    modMapPre.set(mod, existing);

    if (r.region) {
      regionMapPre.set(r.region, (regionMapPre.get(r.region) || 0) + 1);
    }

    // Top 10 per modality
    const top = top10Map.get(mod) || [];
    if (top.length < 10 || r.puntaje_final > top[top.length - 1].puntaje_final) {
      top.push({ apellidos_nombres: r.apellidos_nombres, region: r.region, puntaje_final: r.puntaje_final });
      top.sort((a, b) => b.puntaje_final - a.puntaje_final);
      if (top.length > 10) top.pop();
      top10Map.set(mod, top);
    }
  }

  const porModalidadPre = Array.from(modMapPre.entries())
    .map(([modalidad, s]) => ({
      modalidad,
      total: s.total,
      pmin: s.pmin,
      pmax: s.pmax,
      pavg: Math.round((s.sum / s.total) * 10) / 10,
    }))
    .sort((a, b) => b.total - a.total);

  // Aggregate no preseleccionados
  const modMapNoPre = new Map<string, number>();
  const regionMapNoPre = new Map<string, number>();
  for (const r of allNoPre) {
    modMapNoPre.set(r.modalidad, (modMapNoPre.get(r.modalidad) || 0) + 1);
    if (r.region) {
      regionMapNoPre.set(r.region, (regionMapNoPre.get(r.region) || 0) + 1);
    }
  }

  const porModalidadNoPre = Array.from(modMapNoPre.entries())
    .map(([modalidad, total]) => ({ modalidad, total }))
    .sort((a, b) => b.total - a.total);

  const porRegionPre = Array.from(regionMapPre.entries())
    .map(([region, total]) => ({ region, total }))
    .sort((a, b) => b.total - a.total);

  const porRegionNoPre = Array.from(regionMapNoPre.entries())
    .map(([region, total]) => ({ region, total }))
    .sort((a, b) => b.total - a.total);

  // Top 10 flattened
  const top10: { modalidad: string; apellidos_nombres: string; region: string; puntaje_final: number }[] = [];
  for (const [mod, entries] of top10Map.entries()) {
    for (const e of entries) {
      top10.push({ modalidad: mod, ...e });
    }
  }

  // Cortes and causales (small tables)
  const { data: cortes } = await supabase.from('puntajes_corte').select('*');
  const { data: causales } = await supabase.from('causales_descalificacion').select('*').order('cantidad', { ascending: false });

  return NextResponse.json({
    totales: {
      preseleccionados: preCount || 0,
      no_preseleccionados: nopreCount || 0,
      descalificados: descCount || 0,
      total: (preCount || 0) + (nopreCount || 0) + (descCount || 0),
    },
    por_modalidad_pre: porModalidadPre,
    por_modalidad_nopre: porModalidadNoPre,
    por_region_pre: porRegionPre,
    por_region_nopre: porRegionNoPre,
    top10,
    cortes: cortes || [],
    causales: causales || [],
  });
}
