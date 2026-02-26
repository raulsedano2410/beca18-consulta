import { NextResponse } from "next/server";
import iesData from "@/lib/data/ies.json";

export async function GET() {
  const withGrupo = iesData
    .filter((r) => r.grupo != null)
    .sort((a, b) => (a.grupo ?? 0) - (b.grupo ?? 0) || a.tipo_ies.localeCompare(b.tipo_ies) || a.ies.localeCompare(b.ies));

  const seen = new Set<string>();
  const grupos = withGrupo.filter((r) => {
    const key = `${r.ies}|${r.grupo}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((r) => ({
    ies: r.ies,
    tipo_ies: r.tipo_ies,
    tipo_gestion: r.tipo_gestion,
    grupo: r.grupo,
  }));

  return NextResponse.json({ grupos });
}
