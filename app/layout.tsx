import "./globals.css";

export const metadata = {
  title: "PetroPulse",
  description: "Operations for oil jobbers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 shadow-sm" />
              <span className="text-lg font-semibold tracking-tight">PetroPulse</span>
            </a>
            <nav className="hidden gap-6 text-sm md:flex">
              <a className="hover:text-indigo-600" href="/dashboard">Dashboard</a>
              <a className="hover:text-indigo-600" href="/orders">Orders</a>
              <a className="hover:text-indigo-600" href="/settings/targets">Targets</a>
              <a className="rounded-lg bg-gray-900 px-3 py-1.5 text-white hover:bg-gray-800" href="/login">Login</a>
            </nav>
          </div>
        </header>

        {/* Page container */}
        <main className="mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-gray-500">
            © {new Date().getFullYear()} PetroPulse • Built for oil jobbers
          </div>
        </footer>
      </body>
    </html>
  );
}
