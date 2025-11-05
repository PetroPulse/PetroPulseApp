
'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import Link from 'next/link';

type Order = {
  id: string; org_id: string; date: string; customer: string; product: string;
  quantity: number; revenue: number; profit: number; margin_pct: number; status: 'Paid'|'Outstanding';
};

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ (async()=>{
    const { data, error } = await supabase.from('orders').select('*').order('date', { ascending: true }).limit(5000);
    if (error) console.error(error);
    setOrders((data||[]) as any); setLoading(false);
  })(); },[]);

  const windowed = useMemo(()=> {
    const end = new Date(); const start = new Date(); start.setDate(end.getDate()-30);
    return orders.filter(o => new Date(o.date) >= start);
  },[orders]);

  const totalRevenue = windowed.reduce((s,o)=>s+(o.revenue||0),0);
  const totalProfit  = windowed.reduce((s,o)=>s+(o.profit||0),0);
  const paidCount    = windowed.filter(o=>o.status==='Paid').length;
  const paidPct      = windowed.length ? (paidCount/windowed.length)*100 : 0;
  const outstanding  = windowed.filter(o=>o.status!=='Paid').reduce((s,o)=>s+(o.revenue||0),0);

  const byDate = useMemo(()=>{
    const map: Record<string,{date:string,revenue:number,profit:number}> = {};
    for (const o of windowed) {
      const d = new Date(o.date).toISOString().slice(0,10);
      map[d] ??= { date: d, revenue: 0, profit: 0 };
      map[d].revenue += Number(o.revenue||0);
      map[d].profit  += Number(o.profit||0);
    }
    return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date));
  },[windowed]);

  const topCustomers = useMemo(()=>{
    const m: Record<string, number> = {};
    for (const o of windowed) m[o.customer] = (m[o.customer]||0) + Number(o.revenue||0);
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,value])=>({name, value}));
  },[windowed]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link href="/settings/targets" className="btn btn-ghost">Targets</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        <Kpi label="Total Revenue (30d)" value={fmt(totalRevenue)} />
        <Kpi label="Total Profit (30d)"  value={fmt(totalProfit)} />
        <Kpi label="Paid % (30d)"        value={`${paidPct.toFixed(1)}%`} />
        <Kpi label="Outstanding AR (30d)" value={fmt(outstanding)} />
      </div>

      <div className="mt-6 card p-4">
        <div className="text-sm font-medium mb-2">Revenue & Profit (last 30 days)</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="revenue" />
              <Line dataKey="profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 card p-4">
        <div className="text-sm font-medium mb-2">Top Customers (30d)</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCustomers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Kpi({label, value}:{label:string; value:string}) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
function fmt(n:number){ return n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}); }
