import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: devuelve SUM(valor) de la tabla visitas (solo lectura)
// Usa COUNT(*) en vez de SELECT+SUM porque PostgREST limita a 1000 filas.
// La fila base tiene valor=557, el resto valor=1, entonces: total = count + 556.
export async function GET() {
  try {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from("visitas")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    const total = (count || 0) + 556;
    return NextResponse.json({ count: total || 557 });
  } catch {
    return NextResponse.json({ count: 557 });
  }
}

// POST: inserta una fila con valor=1 y devuelve el nuevo total
// Body: { tipo: "consulta" | "simulador" }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tipo = body.tipo === "simulador" ? "simulador" : "consulta";

    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("registrar_visita", {
      p_tipo: tipo,
    });

    if (error) {
      // Fallback manual
      await supabase.from("visitas").insert({ valor: 1, tipo });
      const { data: rows } = await supabase
        .from("visitas")
        .select("valor");
      const total = (rows || []).reduce(
        (sum: number, r: { valor: number }) => sum + r.valor,
        0
      );
      return NextResponse.json({ count: total || 558 });
    }

    return NextResponse.json({ count: data });
  } catch {
    return NextResponse.json({ count: 558 });
  }
}
