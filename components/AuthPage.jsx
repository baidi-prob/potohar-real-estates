'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Chrome,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase/client';

const RESEND_SECONDS = 60;

function ErrorMessage({ children }) {
  if (!children) return null;
  return (
    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex gap-2">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function OtpBoxes({ value, onChange }) {
  const refs = useRef([]);
  const digits = value.padEnd(6, '').slice(0, 6).split('');

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const updateDigit = (index, nextValue) => {
    const digit = nextValue.replace(/\D/g, '').slice(-1);
    const next = digits.map((item) => item || '');
    next[index] = digit;
    onChange(next.join(''));
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" aria-label="6-digit verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => { refs.current[index] = element; }}
          value={digit}
          inputMode="numeric"
          maxLength={1}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          onChange={(event) => updateDigit(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !digit && index > 0) refs.current[index - 1]?.focus();
          }}
          className="w-11 h-14 sm:w-12 rounded-xl bg-slate-800 border border-slate-700 text-white text-center text-xl font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}

export default function AuthPage({
  isOpen = true,
  onClose,
  onAuthSuccess,
  reason = 'list_property',
  initialMode = 'signup',
}) {
  const [authType, setAuthType] = useState(initialMode);
  const [authStep, setAuthStep] = useState('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const resendTimerRef = useRef(null);
  const supabaseLive = isSupabaseConfigured();

  useEffect(() => () => {
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen || !supabaseLive) return undefined;
    let active = true;
    getSession().then(async (session) => {
      if (!active || !session) return;
      const { data: profile } = await getSupabase().from('profiles').select('email, is_verified').eq('id', session.user.id).maybeSingle();
      if (!active || profile?.is_verified) return;
      try {
        const result = await requestOtp(session);
        if (!active || result.verified) return;
        setSentEmail(result.email || session.user.email || '');
        setAuthStep('verify');
        startResendTimer();
      } catch (error) {
        if (active) setAuthError(error.message || 'Could not send a verification code.');
      }
    });
    return () => { active = false; };
  }, [isOpen, supabaseLive]);

  const startResendTimer = () => {
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    setResendIn(RESEND_SECONDS);
    resendTimerRef.current = setInterval(() => {
      setResendIn((previous) => {
        if (previous <= 1) {
          clearInterval(resendTimerRef.current);
          resendTimerRef.current = null;
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
  };

  const getSession = async () => {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    return data.session;
  };

  const requestOtp = async (session) => {
    const response = await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not send a verification code.');
    return result;
  };

  const userDataFromSession = (session) => ({
    id: session.user.id,
    email: session.user.email,
    phone: phone || session.user.user_metadata?.phone || '',
    name: fullName || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Seller',
  });

  const finishVerifiedAuth = async (session) => {
    const { data: profile } = await getSupabase().from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    onAuthSuccess?.({
      ...userDataFromSession(session),
      phone: profile?.phone || userDataFromSession(session).phone,
      name: profile?.full_name || userDataFromSession(session).name,
    });
  };

  const handleGoogle = async () => {
    setAuthError('');
    if (!supabaseLive) {
      setAuthError('Connect Supabase before enabling Google sign-in.');
      return;
    }
    setIsLoading(true);
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setAuthError(error.message);
      setIsLoading(false);
    }
  };

  const handleCredentials = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');

    if (!supabaseLive) return setAuthError('Connect Supabase in .env.local before creating an account.');
    if (authType === 'signup' && !fullName.trim()) return setAuthError('Enter your name or agency name.');
    if (password.length < 8) return setAuthError('Password must be at least 8 characters.');

    setIsLoading(true);
    try {
      const supabase = getSupabase();
      const authResult = authType === 'signup'
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
          })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (authResult.error) throw authResult.error;
      if (!authResult.data.session) {
        throw new Error('Supabase email confirmation must be disabled. The app uses its own 6-digit verification step.');
      }

      const session = authResult.data.session;
      const otpResult = await requestOtp(session);
      if (otpResult.verified) return finishVerifiedAuth(session);
      setSentEmail(email.trim());
      setAuthStep('verify');
      setOtp('');
      setAuthMessage(`We sent a 6-digit code to ${email.trim()}.`);
      startResendTimer();
    } catch (error) {
      setAuthError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (otp.length !== 6) return setAuthError('Enter all 6 digits from your email.');
    setIsLoading(true);
    setAuthError('');
    try {
      const session = await getSession();
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ code: otp }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Verification failed.');
      await finishVerifiedAuth(session);
    } catch (error) {
      setAuthError(error.message || 'Verification failed.');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || isLoading) return;
    setIsLoading(true);
    setAuthError('');
    try {
      const session = await getSession();
      const result = await requestOtp(session);
      if (result.verified) return finishVerifiedAuth(session);
      setAuthMessage(`A new code was sent to ${sentEmail}.`);
      startResendTimer();
    } catch (error) {
      setAuthError(error.message || 'Could not resend the code.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-md my-auto relative z-10 animate-slideUp">
        <div className="auth-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-800 shadow-2xl bg-slate-900/95">
          {onClose && <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800" title="Close"><X className="w-5 h-5" /></button>}
          <div className="text-center mb-5">
            <p className="text-sm font-bold text-amber-400">Potohar Real Estates</p>
            <p className="text-xs text-emerald-400 mt-0.5">Real estate ko asaan banayen</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-4">{authStep === 'verify' ? 'Verify your email' : reason === 'list_property' ? 'Sell your property' : 'Welcome back'}</h2>
            <p className="text-sm text-slate-400 mt-2">{authStep === 'verify' ? `Enter the code sent to ${sentEmail}.` : 'Sign in to manage your properties or create a free seller account.'}</p>
          </div>

          <ErrorMessage>{authError}</ErrorMessage>
          {authMessage && <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{authMessage}</div>}

          {authStep === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-5 mt-5">
              <OtpBoxes value={otp} onChange={setOtp} />
              <button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 disabled:opacity-50">{isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Verify account</button>
              <div className="text-center">{resendIn > 0 ? <p className="text-xs text-slate-500">Resend code in {resendIn}s</p> : <button type="button" onClick={handleResend} className="text-xs text-amber-400 hover:text-amber-300">Resend code</button>}</div>
              <button type="button" onClick={() => { setAuthStep('form'); setAuthError(''); setAuthMessage(''); }} className="mx-auto flex items-center gap-1 text-xs text-slate-400 hover:text-white"><ArrowLeft className="w-3 h-3" /> Back</button>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-4 mt-5">
                <button type="button" onClick={() => setAuthType('signup')} className={`py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 ${authType === 'signup' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}><UserPlus className="w-4 h-4" /> New account</button>
                <button type="button" onClick={() => setAuthType('login')} className={`py-2.5 rounded-lg text-sm font-bold ${authType === 'login' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>Sign in</button>
              </div>
              <button type="button" onClick={handleGoogle} disabled={isLoading} className="w-full h-11 rounded-xl bg-white text-slate-900 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 disabled:opacity-50"><Chrome className="w-4 h-4" /> Continue with Google</button>
              <div className="flex items-center gap-3 my-4 text-[11px] text-slate-500"><span className="h-px bg-slate-800 flex-1" />OR<span className="h-px bg-slate-800 flex-1" /></div>
              <form onSubmit={handleCredentials} className="space-y-3.5">
                {authType === 'signup' && <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Name or agency name" className="w-full h-11 pl-9 pr-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm" /></div>}
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full h-11 pl-9 pr-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm" /></div>
                {authType === 'signup' && <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ''))} placeholder="Mobile number (+92)" className="w-full h-11 pl-9 pr-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm" /></div>}
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)" className="w-full h-11 pl-9 pr-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm" /></div>
                <button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-bold flex items-center justify-center gap-2 disabled:opacity-50">{isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>{authType === 'signup' ? 'Create account' : 'Sign in'}<ArrowRight className="w-4 h-4" /></>}</button>
              </form>
              <p className="text-center text-[11px] text-slate-500 mt-4">New accounts must verify their email with a one-time 6-digit code.</p>
            </>
          )}
          <div className="mt-5 pt-3 border-t border-slate-800 text-center text-xs text-slate-500"><ShieldCheck className="w-3.5 h-3.5 inline text-emerald-400 mr-1" /> Your details are kept private and secure</div>
        </div>
      </div>
    </div>
  );
}
