'use client';

import React, { useMemo, useState } from 'react';

type ColumnMap = {
  date?: string;
  invoice_number?: string;
  customer?: string;
  product?: string;
  quantity?: string;
  amount?: string;
};

// Simple CSV parser (supports quotes)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (cell.length > 0 || row.length > 0) {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      }
      if (ch === '\r' && next === '\n') i++;
      continue;
    }
    cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.length && !(r.length === 1 && r[0] === ''));
}

export default function ImportPage() {
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requiredFields = useMemo(
    () => [
      { key: 'date', label: 'Invoice Date' },
      { key: 'invoice_number', label: 'Invoice #' },
      { key: 'customer', label: 'Customer' },
      { key: 'product', label: 'Product' },
      { key: 'quantity', label: 'Qty' },
      { key: 'amount', label: 'Amount' },
    ],
    []
  );

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();

    if (name.endsWith('.csv')) {
      const text = await file.text();
      const rows = parseCSV(text);
      if (!rows.length) {
        setError('No rows found in CSV.');
        return;
      }
      setHeaders(rows[0]);
      setPreview(rows.slice(1, 11));

      // auto-suggest header mapping
      const lower = rows[0].map((h) => h.toLowerCase().trim());
      const pick = (...cands: string[]) => {
        const idx = lower.findIndex((h) => cands.some((c) => h.includes(c)));
        return idx >= 0 ? rows[0][idx] : '';
      };
      setColumnMap({
        date: pick('date'),
        invoice_number: pick('invoice', 'inv', '#', 'number', 'no'),
        customer: pick('customer', 'client', 'account'),
        product: pick('product', 'item', 'sku'),
        quantity: pick('qty', 'quantity', 'units'),
        amount: pick('amount', 'total', 'net'),
      });
      return;
    }

    setError('Right now this demo accepts CSV. (Excel/Sheets coming next.)');
  }

  const allMapped =
    headers &&
    requiredFields.every(
      (f) =>
        columnMap[f.key as keyof ColumnMap] &&
        headers.includes(columnMap[f.key as keyof ColumnMap]!)
    );

  async function handleCompleteImport() {
    if (!headers || preview.length === 0) {
      alert('Upload a CSV first');
      return;
    }
    if (!allMapped) {
      alert('Please map all required fields.');
      return;
    }

    // Build row objects from headers + preview rows
    const rows = preview.map((r) => {
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => (obj[h] = r[i]));
      return obj;
    });

    setBusy(true);
    try {
      const res = await fetch('/api/import/invoices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          rows,
          mapping: {
            date: columnMap.date,
            invoice_number: columnMap.invoice_number,
            customer: columnMap.customer,
            product: columnMap.product,
            quantity: columnMap.quantity,
            amount: columnMap.amount,
          },
        }),
      });

      const j = await res.json();
      if (!res.ok) {
        alert(`Import failed: ${j.error || 'unknown error'}`);
        return;
      }
      alert(`Imported ${j.inserted} invoices (from the preview rows).`);
    } catch (e: any) {
      alert(`Import failed: ${e?.message || 'network error'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Import invoices</h1>
      <p className="text-muted-foreground mt-2">
        Upload a CSV export (Sheets → Download CSV, Excel → Save As CSV). Map columns, then import.
      </p>

      <div className="mt-6 grid gap-6">
        {/* Upload */}
        <div className="rounded-2xl border p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-medium">Upload file</h2>
              <p className="text-sm text-muted-foreground">
                CSV supported today. Excel/Sheets connect in the next step.
              </p>
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="block text-sm file:mr-4 file:rounded-xl file:border file:px-4 file:py-2
                         file:bg-black file:text-white hover:file:opacity-90 file:cursor-pointer"
            />
          </div>
          {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
        </div>

        {/* Mapping */}
        {headers && (
          <div className="rounded-2xl border p-6">
            <h2 className="text-xl font-medium mb-4">Map columns</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requiredFields.map(({ key, label }) => (
                <div key={key}>
                  <label className="text-sm font-medium">{label}</label>
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                    value={columnMap[key as keyof ColumnMap] ?? ''}
                    onChange={(e) =>
                      setColumnMap((m) => ({ ...m, [key]: e.target.value }))
                    }
                  >
                    <option value="">Select column…</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {!allMapped && (
              <p className="text-sm text-amber-600 mt-3">
                Map all required fields to continue.
              </p>
            )}
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && headers && (
          <div className="rounded-2xl border p-6 overflow-auto">
            <h2 className="text-xl font-medium mb-4">Preview (first 10 rows)</h2>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-2 border-b font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="odd:bg-muted/30">
                    {r.map((c, j) => (
                      <td key={j} className="px-3 py-2 border-b whitespace-nowrap">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Actions */}
        {headers && (
          <div className="flex gap-3">
            <button
              disabled={!allMapped || busy}
              onClick={handleCompleteImport}
              className="rounded-xl bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
            >
              {busy ? 'Importing…' : 'Complete Import'}
            </button>
            <button
              onClick={() => {
                setHeaders(null);
                setPreview([]);
                setColumnMap({});
                setError(null);
              }}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
