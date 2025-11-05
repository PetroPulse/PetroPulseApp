
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function sendLink() {
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/onboarding' }
    });
    setSent(true);
  }

  return (
    <div className="grid place-items-center h-screen p-6">
      <div className="w-full max-w-md card p-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-brand-900 text-white grid place-items-center font-bold">P</div>
          <div>
            <h1 className="text-lg font-semibold">PetroPulse</h1>
            <p className="text-sm text-neutral-500">Sign in with a magic link</p>
          </div>
        </div>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com"
          className="mt-4 w-full border rounded-2xl px-3 py-2" />
        <button onClick={sendLink} className="mt-3 w-full btn btn-primary">
          {sent ? 'Link sent ✅' : 'Send magic link'}
        </button>
      </div>
    </div>
  );
}
