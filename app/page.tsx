import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <section className="space-y-10">
      <div className="grid items-center gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Run your oil jobber operations with clarity.</h1>
          <p className="text-lg text-muted-foreground">
            PetroPulse centralizes invoices, receivables, and deliveries into a single source of truth.
          </p>
          <div className="flex gap-3">
            <Button asChild><Link href="/connections">Connect your data</Link></Button>
            <Button variant="outline" asChild><Link href="/dashboard">View dashboard</Link></Button>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric label="Invoices" value="12,481" />
              <Metric label="30-day AR" value="$842k" />
              <Metric label="On-time deliveries" value="97.2%" />
              <Metric label="Avg. margin" value="14.6%" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink href="/connections" title="Connections" desc="Excel, Google Sheets, QBO, ERP uploads." />
        <QuickLink href="/orders" title="Orders" desc="Create & track dealer orders." />
        <QuickLink href="/settings/targets" title="Targets" desc="AR grace days, margin goals." />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <a href={href} className="rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md">
      <div className="text-base font-semibold tracking-tight">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </a>
  );
}
