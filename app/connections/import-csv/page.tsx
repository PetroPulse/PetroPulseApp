"use client";
import { useState } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ImportCsvPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");

  function handleFile(file: File) {
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const fields = results.meta.fields || [];
        setRows(data.slice(0, 50)); // show preview
        setHeaders(fields);
      },
    });
  }

  async function continueImport() {
    // TODO: call an API route or server action to insert into Supabase
    alert(`Pretend we imported ${rows.length} rows from ${fileName}. Next: map columns -> Supabase schema.`);
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Import from CSV / Excel</h1>
        <p className="text-muted-foreground">Upload a file exported from QuickBooks, Google Sheets, or your ERP.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Upload file</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input type="file" accept=".csv,.tsv,.xlsx,.xls" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {rows.length > 0 && (
            <div className="rounded-lg border">
              <div className="border-b p-2 text-sm text-muted-foreground">Preview (first {rows.length} rows)</div>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>{headers.map((h) => (<TableHead key={h}>{h}</TableHead>))}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i}>
                        {headers.map((h) => (<TableCell key={h + i}>{String(r[h] ?? "")}</TableCell>))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button disabled={rows.length === 0} onClick={continueImport}>Continue</Button>
            <Button variant="outline" asChild><a href="/connections">Back</a></Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
