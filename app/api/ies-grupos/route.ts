import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data } = await supabase
      .from("ies_elegibles")
      .select("ies, tipo_ies, tipo_gestion, grupo")
      .not("grupo", "is", null)
      .order("grupo")
      .order("tipo_ies")
      .order("ies");

    // Deduplicate by ies name (multiple programs same IES)
    const seen = new Set<string>();
    const grupos = (data || []).filter((r) => {
      const key = `${r.ies}|${r.grupo}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ grupos });
  } catch (error) {
    console.error("Error fetching IES grupos:", error);
    return NextResponse.json({ grupos: [] }, { status: 500 });
  }
}
