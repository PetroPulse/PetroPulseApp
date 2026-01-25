"use client";
import { useState } from "react";

// 👉 Set your batch id here (can change anytime)
const BATCH_ID = "113766de-f5c1-4d89-a10b-96b36e593f7d";

function VerifiedBadge({ status }: { status: string }) {
  const ok = status === "Verified to Source";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium
        ${ok ? "bg-green-100 text-green-700 ring-1 ring-green-300"
             : "bg-amber-100 text-amber-800 ring-1 ring-amber-300"}`}
    >
      {ok ? "✅ Verified to Source" : "⌛ Pending Verification"}
    </span>
  );
}

type AuditData = {
  ok: boolean;
  status: string;
  totals: {
    computed: { revenueFormatted: string; profitFormatted: string };
    source:   { revenueFormatted: string; profitFormatted: string };
    final:    { revenueFormatted: string; profitFormatted: string };
  };
};

export default function AuditPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [batchId, setBatchId] = useState(BATCH_ID);

  const run = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/batches/${batchId}/audit`, { cache: "no-store" });
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit & Verification</h1>
        {data && <VerifiedBadge status={data.status} />}
      </div>

      {/* Batch picker */}
      <div className="rounded-2xl border p-5 bg-white">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Batch ID</label>
            <input
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="paste a batch uuid"
            />
          </div>
          <button
            onClick={run}
            disabled={loading}
            className="rounded-xl px-4 py-2 bg-black text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Run Verification"}
          </button>
        </div>

        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
      </div>

      {/* Results */}
      {data && (
        <div className="rounded-2xl border p-5 bg-white">
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
              onClick={run}
              disabled={loading}
              className="rounded-xl px-4 py-2 border hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Re-running…" : "Re-run Verification"}
            </button>
            <VerifiedBadge status={data.status} />
          </div>
        </div>
      )}
    </div>
  );
}
