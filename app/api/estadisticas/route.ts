import { NextResponse } from 'next/server';
import { estadisticasData } from '@/lib/data/estadisticas';

export async function GET() {
  return NextResponse.json(estadisticasData);
}
