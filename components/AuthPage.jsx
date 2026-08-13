'use client';

import React, { useState } from 'react';
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
  Sparkles,
  AlertCircle,
  X,
  ArrowLeft,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase/client';
import { upsertProfile } from '../lib/listings';

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

  if (!isOpen) return null;

  const supabaseLive = isSupabaseConfigured();

  const buildUserPayload = (session, profileName, profilePhone) => ({
    id: session.user.id,
    email: session.user.email,
    phone: profilePhone || session.user.user_metadata?.phone || '',
    name: profileName || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Seller',
  });

  const handleDemoSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onAuthSuccess?.({
        id: 'demo-user',
        email: 'demo@potohar.com',
        phone: '+92 300 8559922',
        name: 'Demo Seller',
      });
    }, 400);
  };

  const handleGoogleSignIn = async () => {
    if (!supabaseLive) {
      setAuthError('Google Sign-In requires connecting your Supabase project in .env.local.');
      return;
    }

    setIsLoading(true);
    setAuthError('');
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '' },
      });
      if (error) {
        setAuthError(
          `Google Sign-In error: ${error.message}. Ensure Google OAuth is enabled in your Supabase Dashboard → Authentication → Providers.`
        );
        setIsLoading(false);
      }
    } catch (err) {
      setAuthError(err.message || 'Could not initiate Google Sign-In.');
      setIsLoading(false);
    }
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
      handleDemoSignIn();
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
          },
        });

        if (error) throw error;

        if (data.session) {
          const phoneFormatted = phone.trim() ? `+92 ${phone.trim()}` : '';
          await upsertProfile(data.session.user.id, {
            fullName: fullName.trim(),
            phone: phoneFormatted,
            email: email.trim(),
          });
          onAuthSuccess?.(buildUserPayload(data.session, fullName.trim(), phoneFormatted));
        } else {
          setAuthMessage('Account created! Check your email to confirm, then sign in.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        const phoneFormatted = phone.trim() ? `+92 ${phone.trim()}` : '';
        await upsertProfile(data.session.user.id, {
          fullName: fullName.trim() || data.session.user.user_metadata?.full_name,
          phone: phoneFormatted || data.session.user.user_metadata?.phone,
          email: email.trim(),
        });
        onAuthSuccess?.(buildUserPayload(data.session, fullName.trim(), phoneFormatted));
      }
    } catch (err) {
      setAuthError(err.message || 'Something went wrong. Please try again.');
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
      setResetEmailSent(true);
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
                Demo mode — connect Supabase in .env.local for real accounts & saved listings.
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

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-sm flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign in with Google
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-xs text-slate-500 shrink-0">or use email</span>
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
            </form>

            {!supabaseLive && (
              <button
                type="button"
                onClick={handleDemoSignIn}
                className="w-full py-2 text-xs text-slate-500 hover:text-emerald-400"
              >
                Just trying? Skip sign-in (demo mode)
              </button>
            )}
          </div>

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
