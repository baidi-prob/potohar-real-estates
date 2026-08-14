'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  AlertCircle,
  X,
  ArrowLeft,
  UserPlus,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase/client';
import { upsertProfile } from '../lib/listings';

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
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Real email-OTP verification step
  const [authStep, setAuthStep] = useState('form'); // 'form' | 'otp' | 'check_email'
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpResendIn, setOtpResendIn] = useState(0);
  const otpTimerRef = useRef(null);

  const supabaseLive = isSupabaseConfigured();

  const buildUserPayload = (session, profileName, profilePhone) => ({
    id: session.user.id,
    email: session.user.email,
    phone: profilePhone || session.user.user_metadata?.phone || '',
    name: profileName || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Seller',
  });

  const ensureProfile = async (session, profileName, profilePhone) => {
    const phoneFormatted = profilePhone?.trim()
      ? `+92 ${profilePhone.replace(/^\+92\s*/, '').trim()}`
      : session.user.user_metadata?.phone
      ? `+92 ${session.user.user_metadata.phone.replace(/^\+92\s*/, '').trim()}`
      : '';
    const name = profileName?.trim() || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Seller';
    await upsertProfile(session.user.id, {
      fullName: name,
      phone: phoneFormatted || null,
      email: session.user.email,
    });
    return { name, phone: phoneFormatted };
  };

  const startOtpResendTimer = () => {
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    setOtpResendIn(OTP_RESEND_SECONDS);
    otpTimerRef.current = setInterval(() => {
      setOtpResendIn((prev) => {
        if (prev <= 1) {
          clearInterval(otpTimerRef.current);
          otpTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    };
  }, []);

  // All hooks above; early return after them so the hook count never changes.
  if (!isOpen) return null;

  // Send a real 6-digit OTP email via Supabase Auth
  const sendOtp = async (targetEmail, shouldCreateUser) => {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail.trim(),
      options: {
        shouldCreateUser,
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) throw error;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');

    if (!email.trim() || !email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setAuthError('Password should be at least 6 characters.');
      return;
    }
    if (authType === 'signup' && !fullName.trim()) {
      setAuthError('Please type your name or agency name.');
      return;
    }

    if (!supabaseLive) {
      setAuthError('Supabase is not connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.');
      return;
    }

    setIsLoading(true);
    const supabase = getSupabase();

    try {
      if (authType === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
            },
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });

        if (error) throw error;

        if (data.session) {
          const { name, phone: phoneFmt } = await ensureProfile(data.session, fullName, phone);
          onAuthSuccess?.(buildUserPayload(data.session, name, phoneFmt));
        } else {
          // Email confirmation is required: send a 6-digit code as the
          // verification step, mirroring the app's existing "enter your code" UX.
          setOtpEmail(email.trim());
          setOtpCode('');
          setAuthMessage('Account created! We emailed you a verification code to confirm your email.');
          setAuthStep('otp');
          await sendOtp(email.trim(), true);
          startOtpResendTimer();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        const { name, phone: phoneFmt } = await ensureProfile(data.session, fullName, phone);
        onAuthSuccess?.(buildUserPayload(data.session, name, phoneFmt));
      }
    } catch (err) {
      setAuthError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // "Use a 6-digit code instead" — real OTP login/signup via email
  const handleUseCodeInstead = async () => {
    if (!email.trim() || !email.includes('@')) {
      setAuthError('Enter your email address first.');
      return;
    }

    if (!supabaseLive) {
      setAuthError('Supabase is not connected yet. Add the Supabase keys to .env.local.');
      return;
    }

    setAuthError('');
    setAuthMessage('');
    setIsLoading(true);
    try {
      setOtpEmail(email.trim());
      setOtpCode('');
      await sendOtp(email.trim(), authType === 'signup');
      setAuthMessage(`We sent a 6-digit code to ${email.trim()}.`);
      setAuthStep('otp');
      startOtpResendTimer();
    } catch (err) {
      setAuthError(err.message || 'Could not send the verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpResendIn > 0) return;
    setAuthError('');
    setAuthMessage('');
    setIsLoading(true);
    try {
      await sendOtp(otpEmail, authType === 'signup');
      setAuthMessage(`A new 6-digit code was sent to ${otpEmail}.`);
      startOtpResendTimer();
    } catch (err) {
      setAuthError(err.message || 'Could not resend the code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify the real OTP code with Supabase, then treat it as a login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setAuthError('Please enter the 6-digit code from your email.');
      return;
    }

    if (!supabaseLive) {
      setAuthError('Supabase is not connected yet.');
      return;
    }

    setIsLoading(true);
    setAuthError('');
    setAuthMessage('');
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.verifyOtp({
        email: otpEmail.trim(),
        token: otpCode.trim(),
        type: 'email',
      });
      if (error) throw error;

      if (data.session) {
        const { name, phone: phoneFmt } = await ensureProfile(data.session, fullName, phone);
        onAuthSuccess?.(buildUserPayload(data.session, name, phoneFmt));
      } else {
        setAuthError('Could not verify the code. Please try again.');
      }
    } catch (err) {
      setAuthError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setAuthError('Enter your email first.');
      return;
    }

    if (!supabaseLive) {
      setAuthError('Supabase is not connected yet. Add the Supabase keys to .env.local.');
      return;
    }

    const supabase = getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setResetEmailSent(true);
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
                <li><span className="text-amber-400 font-bold">1.</span> New account or already registered</li>
                <li><span className="text-amber-400 font-bold">2.</span> Enter email, password & mobile</li>
                <li><span className="text-amber-400 font-bold">3.</span> Post your property — buyers can contact you</li>
              </ol>
            </div>
          )}

          {authStep === 'otp' ? (
            /* -------------------- 6-DIGIT CODE VERIFICATION -------------------- */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
              <button
                type="button"
                onClick={() => { setAuthStep('form'); setAuthError(''); setAuthMessage(''); }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Enter your verification code</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We sent a 6-digit code to <span className="text-amber-400 font-semibold">{otpEmail}</span>.
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

              <input
                type="text"
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                  if (pasted) { e.preventDefault(); setOtpCode(pasted); }
                }}
                placeholder="000000"
                className="w-full h-14 rounded-xl bg-slate-800 border border-slate-700 text-white text-2xl font-mono text-center tracking-[0.5em] focus:outline-none focus:border-amber-500"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <><span>Verify & continue</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <div className="text-center">
                {otpResendIn > 0 ? (
                  <p className="text-xs text-slate-500">Resend code in {otpResendIn}s</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                  >
                    Resend the code
                  </button>
                )}
              </div>
            </form>
          ) : (
            /* -------------------- SIGN IN / SIGN UP FORM -------------------- */
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
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
                  {authMessage}
                </div>
              )}

              <div className="relative flex items-center justify-center mb-1">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-xs text-slate-500 shrink-0">Sign in with email</span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {authType === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Your name or agency name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Chaudhry Real Estate"
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
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

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-slate-300">Password</label>
                    {authType === 'login' && (
                      <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-amber-400">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      className="w-full h-11 pl-9 pr-10 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authType === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Your mobile number</label>
                    <p className="text-[11px] text-slate-500 mb-1.5">Buyers will call this number (+92 added automatically)</p>
                    <div className="flex gap-2">
                      <span className="h-11 px-3 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-mono text-sm flex items-center gap-1 shrink-0">
                        🇵🇰 +92
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
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Please wait...</>
                  ) : (
                    <><span>{authType === 'signup' ? 'Create account & continue' : 'Sign in'}</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                {authType === 'login' && (
                  <button
                    type="button"
                    onClick={handleUseCodeInstead}
                    disabled={isLoading}
                    className="w-full py-2 text-xs text-slate-400 hover:text-emerald-400 flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Use a 6-digit code from my email instead
                  </button>
                )}
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

      {showForgotPassword && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 relative">
            <button onClick={() => { setShowForgotPassword(false); setResetEmailSent(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <div className="text-center">
              <KeyRound className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">Forgot your password?</h3>
              <p className="text-sm text-slate-400 mt-1">We will email you a link to reset it.</p>
            </div>
            {resetEmailSent ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm text-center space-y-2">
                <p>Check your email for the reset link.</p>
                <button onClick={() => { setShowForgotPassword(false); setResetEmailSent(false); }} className="w-full h-10 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm">
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your email"
                  required
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                />
                <button type="submit" className="w-full h-10 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm">
                  Send reset link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
