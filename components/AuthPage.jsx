'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  X,
  ArrowLeft,
  UserPlus,
  LogIn,
  CheckCircle2,
  User,
} from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase/client';

const OTP_RESEND_SECONDS = 60;

export default function AuthPage({
  isOpen = true,
  onClose,
  onAuthSuccess,
  reason = 'list_property',
  initialMode = 'signup',
}) {
  const [authType, setAuthType] = useState(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  // Sign-in link step
  const [authStep, setAuthStep] = useState('form'); // 'form' | 'sent'
  const [sentEmail, setSentEmail] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const resendTimerRef = useRef(null);

  const supabaseLive = isSupabaseConfigured();

  const startResendTimer = () => {
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    setResendIn(OTP_RESEND_SECONDS);
    resendTimerRef.current = setInterval(() => {
      setResendIn((prev) => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current);
          resendTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  // All hooks above; early return after them so the hook count never changes.
  if (!isOpen) return null;

  // Send a one-time sign-in link via Supabase Auth
  const sendSignInLink = async (targetEmail, shouldCreateUser) => {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail.trim(),
      options: {
        shouldCreateUser,
        data: shouldCreateUser
          ? {
              full_name: fullName?.trim() || undefined,
              phone: phone?.trim() || undefined,
            }
          : undefined,
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) throw error;
    return true;
  };

  // Step 1: send the sign-in link to the entered email
  const handleSendCode = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');

    if (!email.trim() || !email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (authType === 'signup' && !fullName.trim()) {
      setAuthError('Please type your name or agency name.');
      return;
    }

    if (!supabaseLive) {
      setAuthError('Supabase is not connected yet. Add the Supabase keys to .env.local.');
      return;
    }

    setIsLoading(true);
    try {
      setSentEmail(email.trim());
      await sendSignInLink(email.trim(), authType === 'signup');
      setAuthMessage(`We sent a sign-in link to ${email.trim()}.`);
      setAuthStep('sent');
      startResendTimer();
    } catch (err) {
      setAuthError(err.message || 'Could not send the sign-in link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend the sign-in link
  const handleResendOtp = async () => {
    if (resendIn > 0) return;
    setAuthError('');
    setAuthMessage('');
    setIsLoading(true);
    try {
      await sendSignInLink(sentEmail, authType === 'signup');
      setAuthMessage(`A new sign-in link was sent to ${sentEmail}.`);
      startResendTimer();
    } catch (err) {
      setAuthError(err.message || 'Could not resend the link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-md my-auto relative z-10 animate-slideUp">
        <div className="auth-glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-800 shadow-2xl bg-slate-900/95">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="text-center mb-5">
            <p className="text-sm font-bold text-amber-400">Potohar Real Estates</p>
            <p className="text-xs text-emerald-400 mt-0.5">Real estate ko asaan banayen</p>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-4">
              {reason === 'list_property' ? 'Sell your property' :
               reason === 'my_listings' ? 'View your ads' : 'Your account'}
            </h2>

            <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
              {reason === 'list_property'
                ? 'Create a free account to post your plot, house, or farmhouse. Browsing is free — no account needed.'
                : reason === 'my_listings'
                ? 'Sign in to see and manage the properties you have posted.'
                : 'Sign in to manage your account and listings.'}
            </p>

            {!supabaseLive && (
              <p className="mt-2 text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                Supabase is not connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable real accounts.
              </p>
            )}
          </div>

          {reason === 'list_property' && (
            <div className="mb-5 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">How it works</p>
              <ol className="text-xs text-slate-400 space-y-1.5 list-none">
                <li><span className="text-amber-400 font-bold">1.</span> Enter your email address</li>
                <li><span className="text-amber-400 font-bold">2.</span> We email you a sign-in link</li>
                <li><span className="text-amber-400 font-bold">3.</span> Click it — you're in. Post your property</li>
              </ol>
            </div>
          )}

          {authStep === 'sent' ? (
            /* -------------------- SIGN-IN LINK SENT -------------------- */
            <div className="space-y-4 animate-fadeIn">
              <button
                type="button"
                onClick={() => { setAuthStep('form'); setAuthError(''); setAuthMessage(''); }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Check your email</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We sent a sign-in link to <span className="text-amber-400 font-semibold">{sentEmail}</span>. Open
                  your email and click the button to finish signing in.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authMessage}</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Step 1</p>
                    <p className="text-xs text-slate-400">Check your inbox (and spam/promotions)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Step 2</p>
                    <p className="text-xs text-slate-400">Click the "Sign in" button in the email</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                {resendIn > 0 ? (
                  <p className="text-xs text-slate-500">Resend link in {resendIn}s</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : "Didn't get it? Resend the link"}
                  </button>
                )}
              </div>

              <p className="text-center text-[11px] text-slate-500">
                The link expires shortly and can only be used once.
              </p>
            </div>
          ) : (
            /* -------------------- EMAIL + CODE FORM -------------------- */
            <div className="space-y-4">
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-4">
                <button
                  type="button"
                  onClick={() => { setAuthType('signup'); setAuthError(''); setAuthMessage(''); }}
                  className={`py-2.5 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                    authType === 'signup' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" /> New account
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthType('login'); setAuthError(''); setAuthMessage(''); }}
                  className={`py-2.5 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                    authType === 'login' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" /> Already registered
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
                  {authMessage}
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-3.5">
                {authType === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Your name or agency name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Chaudhry Real Estate"
                        className="w-full h-11 pl-9 pr-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Your email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      required
                      className="w-full h-11 pl-9 pr-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {authType === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Your mobile number</label>
                    <p className="text-[11px] text-slate-500 mb-1.5">Buyers will call this number (+92 added automatically)</p>
                    <div className="flex gap-2">
                      <span className="h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-mono text-sm flex items-center gap-1 shrink-0">
                        +92
                      </span>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                          placeholder="300 1234567"
                          className="w-full h-11 pl-9 pr-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 mt-1 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Sending link...</>
                  ) : (
                    <><span>{authType === 'signup' ? 'Create account & send link' : 'Email me a sign-in link'}</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-500">
                  No password needed — we email you a sign-in link each time.
                </p>
              </form>
            </div>
          )}

          <div className="mt-5 pt-3 border-t border-slate-800/80 text-center text-xs text-slate-500">
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Your details are kept private and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
