'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import VerifyOtpPage from '../../../components/VerifyOtpPage';
import { getSupabase } from '../../../lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const completeGoogleSignIn = async () => {
      const supabase = getSupabase();
      const code = new URLSearchParams(window.location.search).get('code');
      if (!supabase || !code) {
        setError('Google sign-in could not be completed. Please try again.');
        return;
      }
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        setError('No sign-in session was created. Please try again.');
        return;
      }
      const response = await fetch('/api/auth/otp/request', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Could not start email verification.');
        return;
      }
      if (result.verified) {
        router.replace('/');
        return;
      }
      if (active) setEmail(result.email || session.user.email || '');
    };
    completeGoogleSignIn().catch((callbackError) => setError(callbackError.message || 'Google sign-in failed.'));
    return () => { active = false; };
  }, [router]);

  if (error) return <main className="min-h-screen flex items-center justify-center p-6 text-center text-red-300">{error}</main>;
  if (email) return <VerifyOtpPage email={email} />;
  return <main className="min-h-screen flex items-center justify-center text-slate-400">Completing secure sign-in...</main>;
}
