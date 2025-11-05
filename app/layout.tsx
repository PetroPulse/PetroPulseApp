import "./globals.css";
import { inter } from "./fonts";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata = {
  title: "PetroPulse",
  description: "Vertical SaaS for oil jobbers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="hidden border-r bg-card/50 backdrop-blur md:block md:w-64">
              <div className="sticky top-0 p-4">
                <div className="mb-6 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-indigo-600 shadow-sm" />
                  <div className="text-lg font-semibold tracking-tight">PetroPulse</div>
                </div>
                <nav className="space-y-1 text-sm">
                  <a className="block rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard">Dashboard</a>
                  <a className="block rounded-lg px-3 py-2 hover:bg-muted" href="/orders">Orders</a>
                  <a className="block rounded-lg px-3 py-2 hover:bg-muted" href="/settings/targets">Targets</a>
                  <a className="block rounded-lg px-3 py-2 hover:bg-muted" href="/connections">Connections</a>
                </nav>
              </div>
            </aside>

            {/* Main */}
            <div className="flex-1">
              <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                  <div className="md:hidden flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-indigo-600" />
                    <span className="font-semibold">PetroPulse</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Theme toggle */}
                    <ThemeToggle />
                    <a className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-90" href="/login">Login</a>
                  </div>
                </div>
              </header>

              <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

              <footer className="mt-10 border-t">
                <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
                  © {new Date().getFullYear()} PetroPulse • Built for oil jobbers
                </div>
              </footer>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

function ThemeToggle() {
  // minimal client component inline
  return (
    <a href="/settings/appearance" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">Theme</a>
  );
}
