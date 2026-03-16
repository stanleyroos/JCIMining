import { NextRequest, NextResponse } from 'next/server';
import { runMatching } from '@/lib/matching';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const result = await runMatching(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Matching error:', err);
    return NextResponse.json({ error: 'Matching failed' }, { status: 500 });
  }
}
