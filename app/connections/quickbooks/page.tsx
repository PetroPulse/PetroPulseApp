import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuickBooksPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">QuickBooks Online</h1>
        <p className="text-muted-foreground">Connect your QBO company and sync invoices & customers.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
          <CardDescription>We’ll use OAuth to securely connect to your QuickBooks company.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Button disabled>Connect QuickBooks (soon)</Button>
          <Button variant="outline" asChild><a href="/connections">Back</a></Button>
        </CardContent>
      </Card>
    </section>
  );
}
