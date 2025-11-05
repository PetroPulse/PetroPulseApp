
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [targetMargin, setTargetMargin] = useState(0.12);
  const [dso, setDso] = useState(28);
  const [grace, setGrace] = useState(7);
  const [early, setEarly] = useState(0.02);
  const [horizon, setHorizon] = useState(14);

  useEffect(()=>{ (async()=>{
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) location.href='/login';
  })(); },[]);

  async function createOrg() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return location.assign('/login');

    const { data: org, error: e1 } = await supabase
      .from('organizations').insert({ name: orgName }).select().single();
    if (e1) return alert(e1.message);

    const { error: e2 } = await supabase
      .from('members').insert({ org_id: org.id, user_id: user.id, role: 'owner' });
    if (e2) return alert(e2.message);

    const { error: e3 } = await supabase.from('org_targets').insert({
      org_id: org.id,
      target_margin_pct: targetMargin,
      dso_target_days: dso,
      ar_grace_days: grace,
      early_pay_discount_max: early,
      forecast_horizon_days: horizon,
      currency: 'USD'
    });
    if (e3) return alert(e3.message);

    router.push('/dashboard');
  }

  return (
    <div className="container py-10">
      <div className="card p-6">
        <h1 className="text-lg font-semibold">Create your organization</h1>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-xs text-neutral-500">Organization name</label>
            <input className="w-full border rounded-2xl px-3 py-2"
              value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="Acme Oil LLC" />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Target margin %</label>
            <input type="number" step="0.001" className="w-full border rounded-2xl px-3 py-2"
              value={targetMargin} onChange={e=>setTargetMargin(parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-neutral-500">DSO target (days)</label>
            <input type="number" className="w-full border rounded-2xl px-3 py-2"
              value={dso} onChange={e=>setDso(parseInt(e.target.value||'0'))} />
          </div>
          <div>
            <label className="text-xs text-neutral-500">AR grace days</label>
            <input type="number" className="w-full border rounded-2xl px-3 py-2"
              value={grace} onChange={e=>setGrace(parseInt(e.target.value||'0'))} />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Max early-pay discount</label>
            <input type="number" step="0.001" className="w-full border rounded-2xl px-3 py-2"
              value={early} onChange={e=>setEarly(parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Forecast horizon (days)</label>
            <input type="number" className="w-full border rounded-2xl px-3 py-2"
              value={horizon} onChange={e=>setHorizon(parseInt(e.target.value||'0'))} />
          </div>
        </div>
        <button onClick={createOrg} className="mt-4 btn btn-primary">Continue</button>
      </div>
    </div>
  );
}
