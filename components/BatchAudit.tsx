"use client";
import { useState } from "react";
import VerifiedBadge from "./VerifiedBadge";

type AuditData = {
  ok: boolean;
  status: string;
  totals: {
    computed: { revenueFormatted: string; profitFormatted: string };
    source:   { revenueFormatted: string; profitFormatted: string };
    final:    { revenueFormatted: string; profitFormatted: string };
  };
};

export default function BatchAudit({ batchId }: { batchId: string }) {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/batches/${batchId}/audit`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Audit failed");
      setData(json);
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-5 shadow-sm bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold">Audit Trail</div>
        {data && <VerifiedBadge status={data.status} />}
      </div>

      {!data ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Click to verify this batch matches the accounting source totals.
          </p>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl px-4 py-2 bg-black text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Run Verification"}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500 mb-1">Source Totals</div>
              <div className="text-sm">Revenue: <b>{data.totals.source.revenueFormatted}</b></div>
              <div className="text-sm">Profit: <b>{data.totals.source.profitFormatted}</b></div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500 mb-1">Computed (pre-adjust)</div>
              <div className="text-sm">Revenue: <b>{data.totals.computed.revenueFormatted}</b></div>
              <div className="text-sm">Profit: <b>{data.totals.computed.profitFormatted}</b></div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500 mb-1">Final (shown)</div>
              <div className="text-sm">Revenue: <b>{data.totals.final.revenueFormatted}</b></div>
              <div className="text-sm">Profit: <b>{data.totals.final.profitFormatted}</b></div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-xl px-4 py-2 border hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Re-running…" : "Re-run Verification"}
            </button>
            <VerifiedBadge status={data.status} />
          </div>

          {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
        </>
      )}

      {err && !data && <p className="text-sm text-red-600 mt-3">{err}</p>}
    </div>
  );
}
