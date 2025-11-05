import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Connections – PetroPulse" };

export default function ConnectionsPage() {
  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
        <p className="mt-1 text-muted-foreground">Connect or import your invoicing data. Start with the method you use today.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Connector title="Excel / CSV" desc="Upload xlsx/csv exports of invoices, dealers, products." href="/connections/import-csv" />
        <Connector title="Google Sheets" desc="Sync a live sheet tab with invoice rows." href="/connections/google-sheets" />
        <Connector title="QuickBooks Online" desc="OAuth connect QBO company and sync invoices." href="/connections/quickbooks" />
        <Connector title="Generic ERP Upload" desc="Drop periodic CSV/TSV exports from your ERP." href="/connections/erp-upload" />
        <Connector title="SFTP Drop" desc="Automate nightly file drops from on-prem systems." href="/connections/sftp" />
        <Connector title="API" desc="Use our API to push invoices in real-time." href="/connections/api" />
      </div>
    </section>
  );
}

function Connector({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Card className="hover:shadow-md transition">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild><Link href={href}>Set up</Link></Button>
      </CardContent>
    </Card>
  );
}
