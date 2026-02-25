import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function fetchAllScores(table: string, modalidad: string): Promise<{ puntaje_final: number }[]> {
  const results: { puntaje_final: number }[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data } = await supabase
      .from(table)
      .select('puntaje_final')
      .eq('modalidad', modalidad)
      .range(from, from + pageSize - 1);
    if (data && data.length > 0) {
      results.push(...data);
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  return results;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dni: string }> }
) {
  const { dni } = await params;
  if (!dni || !/^\d{7,8}$/.test(dni)) {
    return NextResponse.json({ error: 'DNI invalido' }, { status: 400 });
  }

  // Buscar en preseleccionados
  const { data: preData } = await supabase
    .from('preseleccionados')
    .select('*')
    .eq('dni', dni)
    .limit(1);

  if (preData && preData.length > 0) {
    const persona = preData[0];
    const mod = persona.modalidad;
    const region = persona.region;

    // Ranking general (ALL preseleccionados, all modalities)
    const { count: higherGeneral } = await supabase
      .from('preseleccionados')
      .select('*', { count: 'exact', head: true })
      .gt('puntaje_final', persona.puntaje_final);

    const { count: totalGeneral } = await supabase
      .from('preseleccionados')
      .select('*', { count: 'exact', head: true });

    // Ranking within modality
    const { count: higherGlobal } = await supabase
      .from('preseleccionados')
      .select('*', { count: 'exact', head: true })
      .eq('modalidad', mod)
      .gt('puntaje_final', persona.puntaje_final);

    const { count: totalGlobal } = await supabase
      .from('preseleccionados')
      .select('*', { count: 'exact', head: true })
      .eq('modalidad', mod);

    // Ranking regional
    const { count: higherRegional } = await supabase
      .from('preseleccionados')
      .select('*', { count: 'exact', head: true })
      .eq('modalidad', mod)
      .eq('region', region)
      .gt('puntaje_final', persona.puntaje_final);

    const { count: totalRegional } = await supabase
      .from('preseleccionados')
      .select('*', { count: 'exact', head: true })
      .eq('modalidad', mod)
      .eq('region', region);

    // Same score counts
    const { count: sameGlobal } = await supabase
      .from('preseleccionados')
      .select('*', { count: 'exact', head: true })
      .eq('modalidad', mod)
      .eq('puntaje_final', persona.puntaje_final);

    // Distribution (paginated fetch for large modalities)
    const allScores = await fetchAllScores('preseleccionados', mod);

    const distribMap = new Map<number, number>();
    for (const r of allScores) {
      distribMap.set(r.puntaje_final, (distribMap.get(r.puntaje_final) || 0) + 1);
    }
    const distribucion = Array.from(distribMap.entries())
      .map(([puntaje, cantidad]) => ({ puntaje, cantidad }))
      .sort((a, b) => a.puntaje - b.puntaje);

    // Corte
    const { data: corteData } = await supabase
      .from('puntajes_corte')
      .select('*')
      .eq('modalidad', mod)
      .limit(1);

    const ranking_global = (higherGlobal || 0) + 1;
    const total_modalidad = totalGlobal || 0;

    const ranking_general = (higherGeneral || 0) + 1;
    const total_general = totalGeneral || 0;

    return NextResponse.json({
      tipo: 'preseleccionado',
      datos: persona,
      ranking_general,
      total_general,
      ranking_modalidad: ranking_global,
      total_modalidad,
      ranking_regional: (higherRegional || 0) + 1,
      total_region: totalRegional || 0,
      percentil: Number((((total_modalidad - ranking_global) / total_modalidad) * 100).toFixed(1)),
      mismo_puntaje_global: sameGlobal || 0,
      distribucion,
      corte: corteData?.[0] || null,
    });
  }

  // Buscar en no_preseleccionados
  const { data: nopreData } = await supabase
    .from('no_preseleccionados')
    .select('*')
    .eq('dni', dni)
    .limit(1);

  if (nopreData && nopreData.length > 0) {
    const persona = nopreData[0];
    const mod = persona.modalidad;

    // Corte
    const { data: corteData } = await supabase
      .from('puntajes_corte')
      .select('*')
      .eq('modalidad', mod)
      .limit(1);

    const corteVal = corteData?.[0]?.min_preseleccionado || 0;

    // Near cutoff counts
    const nearCounts = await Promise.all(
      [1, 2, 5, 10].map(async (n) => {
        const { count } = await supabase
          .from('no_preseleccionados')
          .select('*', { count: 'exact', head: true })
          .eq('modalidad', mod)
          .gte('puntaje_final', corteVal - n);
        return count || 0;
      })
    );

    // Distribution (paginated fetch for large modalities)
    const allScores = await fetchAllScores('no_preseleccionados', mod);

    const distribMap = new Map<number, number>();
    for (const r of allScores) {
      distribMap.set(r.puntaje_final, (distribMap.get(r.puntaje_final) || 0) + 1);
    }
    const distribucion = Array.from(distribMap.entries())
      .map(([puntaje, cantidad]) => ({ puntaje, cantidad }))
      .sort((a, b) => a.puntaje - b.puntaje);

    // Ranking
    const { count: higherGlobal } = await supabase
      .from('no_preseleccionados')
      .select('*', { count: 'exact', head: true })
      .eq('modalidad', mod)
      .gt('puntaje_final', persona.puntaje_final);

    const { count: totalGlobal } = await supabase
      .from('no_preseleccionados')
      .select('*', { count: 'exact', head: true })
      .eq('modalidad', mod);

    return NextResponse.json({
      tipo: 'no_preseleccionado',
      datos: persona,
      corte: corteData?.[0] || null,
      puntos_faltantes: corteVal - persona.puntaje_final,
      cerca_del_corte: {
        a_1_punto: nearCounts[0],
        a_2_puntos: nearCounts[1],
        a_5_puntos: nearCounts[2],
        a_10_puntos: nearCounts[3],
      },
      distribucion,
      ranking_global: (higherGlobal || 0) + 1,
      total_modalidad: totalGlobal || 0,
    });
  }

  // Buscar en descalificados
  const { data: descData } = await supabase
    .from('descalificados')
    .select('*')
    .eq('dni', dni)
    .limit(1);

  if (descData && descData.length > 0) {
    const persona = descData[0];

    // Find matching causal
    const { data: causales } = await supabase
      .from('causales_descalificacion')
      .select('*')
      .order('cantidad', { ascending: false });

    const matchingCausal = (causales || []).find((c) =>
      persona.causal.includes(c.causal_codigo)
    );

    return NextResponse.json({
      tipo: 'descalificado',
      datos: persona,
      causal_descripcion: matchingCausal?.causal_descripcion || persona.causal,
      stats_causales: causales || [],
    });
  }

  return NextResponse.json({ error: 'DNI no encontrado', tipo: 'no_encontrado' }, { status: 404 });
}
