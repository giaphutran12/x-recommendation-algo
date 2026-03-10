import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || !authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { seed } = await import('@/lib/seed');
    await seed();
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[SEED] API route error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
