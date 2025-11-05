import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GoogleSheetsPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Google Sheets</h1>
        <p className="text-muted-foreground">Sync a live sheet tab of invoice rows. OAuth setup coming next.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>How it will work</CardTitle>
          <CardDescription>We’ll request read access to a selected Sheet and map your columns to PetroPulse fields.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Click “Connect Google”</li>
            <li>Select your spreadsheet and tab</li>
            <li>Map columns (invoice_id, date, dealer, product, qty, price, total)</li>
            <li>Save & sync</li>
          </ol>
          <div className="flex gap-2">
            <Button disabled>Connect Google (soon)</Button>
            <Button variant="outline" asChild><a href="/connections">Back</a></Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
