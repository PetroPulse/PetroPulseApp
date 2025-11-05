
'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Order = { id:string; date:string; customer:string; product:string; status:'Paid'|'Outstanding'; revenue:number; profit:number; margin_pct:number; };

export default function Orders() {
  const [rows,setRows] = useState<Order[]>([]);
  const [q,setQ] = useState(''); const [status,setStatus] = useState<'All'|'Paid'|'Outstanding'>('All');

  useEffect(()=>{ (async()=>{
    const { data, error } = await supabase.from('orders').select('id,date,customer,product,status,revenue,profit,margin_pct').order('date',{ascending:false}).limit(1000);
    if(error) console.error(error);
    setRows((data||[]) as any);
  })(); },[]);

  const filtered = useMemo(()=> rows.filter(r=>{
    if(status!=='All' && r.status!==status) return false;
    if(q && !(`${r.customer} ${r.product}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }),[rows,q,status]);

  return (
    <div className="container py-6">
      <h1 className="text-xl font-semibold">Orders</h1>
      <div className="mt-4 flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search customer or product…" className="border rounded-2xl px-3 py-2 w-72"/>
        <select value={status} onChange={e=>setStatus(e.target.value as any)} className="border rounded-2xl px-3 py-2">
          <option>All</option><option>Paid</option><option>Outstanding</option>
        </select>
      </div>
      <div className="mt-4 card overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Product</th>
              <th className="text-right p-3">Revenue</th>
              <th className="text-right p-3">Profit</th>
              <th className="text-right p-3">Margin %</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r=>(
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.date}</td>
                <td className="p-3">{r.customer}</td>
                <td className="p-3">{r.product}</td>
                <td className="p-3 text-right">{fmt(r.revenue)}</td>
                <td className="p-3 text-right">{fmt(r.profit)}</td>
                <td className="p-3 text-right">{((r.margin_pct||0)*100).toFixed(1)}%</td>
                <td className="p-3">{r.status}</td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={7} className="p-6 text-center text-neutral-500">No results</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function fmt(n:number){ return n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}); }
