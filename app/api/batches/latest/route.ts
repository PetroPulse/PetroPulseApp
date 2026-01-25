import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1️⃣ Get the latest batch for your organization (replace this org_id later if needed)
    const { data: latestBatch, error } = await supabase
      .from('invoice_batches')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !latestBatch) {
      return NextResponse.json({ ok: false, error: 'No batches found' }, { status: 404 });
    }

    // 2️⃣ Call your existing /api/batches/[id]/audit route using that ID
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/batches/${latestBatch.id}/audit`,
      { cache: 'no-store' }
    );

    const auditData = await res.json();

    // 3️⃣ Return that data directly
    return NextResponse.json(auditData);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Failed to load latest batch' }, { status: 500 });
  }
}
