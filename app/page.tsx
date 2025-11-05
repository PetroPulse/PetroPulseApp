export default function Home() {
  const card = "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md";
  const title = "text-base font-semibold tracking-tight";
  const desc = "mt-1 text-sm text-gray-600";
  return (
    <section className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to PetroPulse</h1>
          <p className="mt-1 text-gray-600">Run your oil jobber operations with clarity and speed.</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <a className={card} href="/dashboard">
          <div className={title}>Dashboard</div>
          <p className={desc}>KPIs, receivables, deliveries at a glance.</p>
        </a>
        <a className={card} href="/orders">
          <div className={title}>Orders</div>
          <p className={desc}>Create and track dealer orders.</p>
        </a>
        <a className={card} href="/settings/targets">
          <div className={title}>Targets</div>
          <p className={desc}>AR grace days & margin goals.</p>
        </a>
        <a className={card} href="/login">
          <div className={title}>Login</div>
          <p className={desc}>Authenticate with Supabase.</p>
        </a>
      </div>
    </section>
  );
}
