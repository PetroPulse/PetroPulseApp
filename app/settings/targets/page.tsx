
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Targets() {
  const [t, setT] = useState<any>(null);
  const [orgId, setOrgId] = useState<string| null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ (async()=>{
    const { data: { user } } = await supabase.auth.getUser();
    if(!user){ location.href='/login'; return; }
    const { data: mem } = await supabase.from('members').select('org_id').eq('user_id', user.id).limit(1).maybeSingle();
    if(!mem){ setLoading(false); return; }
    setOrgId(mem.org_id);
    const { data } = await supabase.from('org_targets').select('*').eq('org_id', mem.org_id).maybeSingle();
    setT(data); setLoading(false);
  })(); },[]);

  async function save() {
    if(!orgId) return;
    const { error } = await supabase.from('org_targets').upsert({ org_id: orgId, ...t, updated_at: new Date().toISOString() });
    if(error) alert(error.message); else alert('Saved');
  }

  if(loading) return <div className="p-6">Loading…</div>;
  if(!t) return <div className="p-6">No targets yet. Please complete onboarding.</div>;

  return (
    <div className="container py-6">
      <h1 className="text-xl font-semibold">Targets</h1>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Field label="Target margin %" value={t.target_margin_pct} onChange={(v)=>setT({...t, target_margin_pct: parseFloat(v)})} />
        <Field label="DSO target days" value={t.dso_target_days} onChange={(v)=>setT({...t, dso_target_days: parseInt(v||'0')})} />
        <Field label="AR grace days" value={t.ar_grace_days} onChange={(v)=>setT({...t, ar_grace_days: parseInt(v||'0')})} />
        <Field label="Max early-pay discount" value={t.early_pay_discount_max} onChange={(v)=>setT({...t, early_pay_discount_max: parseFloat(v)})} />
        <Field label="Forecast horizon days" value={t.forecast_horizon_days} onChange={(v)=>setT({...t, forecast_horizon_days: parseInt(v||'0')})} />
        <Field label="Currency" value={t.currency} onChange={(v)=>setT({...t, currency: v})} />
      </div>
      <button onClick={save} className="mt-4 btn btn-primary">Save</button>
    </div>
  );
}

function Field({label, value, onChange}:{label:string; value:any; onChange:(v:string)=>void}){
  return (
    <div>
      <label className="text-xs text-neutral-500">{label}</label>
      <input className="w-full border rounded-2xl px-3 py-2" value={value ?? ''} onChange={e=>onChange(e.target.value)} />
    </div>
  );
}
