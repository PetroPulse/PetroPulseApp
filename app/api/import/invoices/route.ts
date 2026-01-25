import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = body?.rows ?? [];
    const mapping = body?.mapping ?? {};

    if (!Array.isArray(rows) || !mapping?.invoice_number) {
      return NextResponse.json(
        { error: "Missing rows or mapping information" },
        { status: 400 }
      );
    }

    const formatted = rows
      .map((row: Record<string, any>) => {
        const pick = (key?: string) => (key ? row[key] : undefined);
        const toNumber = (val: any) => {
          const num = Number(String(val ?? "").replace(/[^0-9.\-]/g, ""));
          return Number.isFinite(num) ? Math.round(num * 100) : 0;
        };

        return {
          invoice_no: String(pick(mapping.invoice_number) ?? "").trim(),
          invoice_date: String(pick(mapping.date) ?? "").slice(0, 10) || null,
          total_cents: toNumber(pick(mapping.amount)),
          status: "open",
        };
      })
      .filter((r) => r.invoice_no);

    if (formatted.length === 0) {
      return NextResponse.json(
        { error: "No valid invoices found" },
        { status: 400 }
      );
    }

    const { error } = await supabase().from("invoices").insert(formatted);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, inserted: formatted.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
