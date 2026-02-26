import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("visitas")
      .select("count")
      .eq("id", 1)
      .single();
    if (error) throw error;
    return NextResponse.json({ count: data.count });
  } catch {
    return NextResponse.json({ count: 557 });
  }
}

export async function POST() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("increment_visitas");
    if (error) {
      // Fallback: read + update
      const { data: current } = await supabase
        .from("visitas")
        .select("count")
        .eq("id", 1)
        .single();
      const newCount = (current?.count || 557) + 1;
      await supabase
        .from("visitas")
        .update({ count: newCount })
        .eq("id", 1);
      return NextResponse.json({ count: newCount });
    }
    return NextResponse.json({ count: data });
  } catch {
    return NextResponse.json({ count: 558 });
  }
}
