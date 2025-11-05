
import Link from "next/link";

export default function Home() {
  return (
    <main className="container py-10">
      <div className="card p-6">
        <h1 className="text-xl font-semibold">Welcome to PetroPulse</h1>
        <p className="text-neutral-600 mt-2">
          The AI analyst that boosts margin, reduces AR, and forecasts demand for oil jobbers.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/login" className="btn btn-primary">Log in</Link>
          <Link href="/login" className="btn btn-ghost">Create account</Link>
        </div>
      </div>
    </main>
  );
}
