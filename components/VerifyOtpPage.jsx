'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '../lib/supabase/client';

export default function VerifyOtpPage({ email = '' }) {
  const router = useRouter();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(60);
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
    const timer = setInterval(() => setResendIn((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const setDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits((previous) => previous.map((item, itemIndex) => itemIndex === index ? digit : item));
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const verify = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const session = (await getSupabase().auth.getSession()).data.session;
    if (!session) return setError('Your sign-in session expired. Start again from the sign-in form.');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ code: digits.join('') }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Verification failed.');
      router.replace('/');
    } catch (verificationError) {
      setError(verificationError.message);
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0 || loading) return;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const session = (await getSupabase().auth.getSession()).data.session;
      const response = await fetch('/api/auth/otp/request', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not resend code.');
      setMessage('A new verification code was sent.');
      setResendIn(60);
    } catch (resendError) {
      setError(resendError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400"><ShieldCheck className="h-7 w-7" /></div>
          <p className="text-sm font-bold text-amber-400">Potohar Real Estates</p>
          <h1 className="mt-3 text-2xl font-extrabold text-white">Verify your email</h1>
          <p className="mt-2 text-sm text-slate-400">Enter the 6-digit code sent to {email || 'your email address'}.</p>
        </div>
        {error && <div className="mt-5 flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        {message && <div className="mt-5 flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4 shrink-0" />{message}</div>}
        <form onSubmit={verify} className="mt-7 space-y-6">
          <div className="flex justify-center gap-2">
            {digits.map((digit, index) => <input key={index} ref={(element) => { refs.current[index] = element; }} value={digit} onChange={(event) => setDigit(index, event.target.value)} onKeyDown={(event) => { if (event.key === 'Backspace' && !digit && index > 0) refs.current[index - 1]?.focus(); }} inputMode="numeric" maxLength={1} className="h-14 w-11 rounded-xl border border-slate-700 bg-slate-800 text-center text-xl font-bold text-white focus:border-amber-500 focus:outline-none" aria-label={`Digit ${index + 1}`} />)}
          </div>
          <button disabled={loading || digits.join('').length !== 6} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 font-bold text-slate-950 disabled:opacity-50">{loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Verify account'}</button>
        </form>
        <div className="mt-5 text-center">{resendIn ? <p className="text-xs text-slate-500">Resend code in {resendIn}s</p> : <button onClick={resend} className="text-xs font-semibold text-amber-400 hover:text-amber-300">Resend code</button>}</div>
      </section>
    </main>
  );
}
