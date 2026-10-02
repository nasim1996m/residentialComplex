'use client';

import React, { useState } from 'react';
import { Building2, LogIn } from 'lucide-react';
import { api } from '@/lib/api';

export function LoginForm({ googleEnabled, initialError }: { googleEnabled: boolean; initialError: string | null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/api/auth/login', { method: 'POST', body: { email, password } });
      window.location.href = '/';
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-card w-full max-w-sm p-8 rounded-3xl space-y-5 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">نظام المجمعات السكنية</h1>
            <p className="text-xs text-gray-400">تسجيل الدخول إلى حسابك</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-300">
            البريد الإلكتروني
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
          </label>
          <label className="block text-xs font-bold text-gray-300">
            كلمة المرور
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              required
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" /> {busy ? 'جاري الدخول...' : 'دخول'}
        </button>

        {googleEnabled && (
          <>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span className="flex-1 h-px bg-slate-800" /> أو <span className="flex-1 h-px bg-slate-800" />
            </div>
            <a
              href="/api/auth/google"
              className="w-full py-2.5 bg-white hover:bg-gray-100 text-slate-900 font-bold text-sm rounded-xl flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 48 48" className="w-4 h-4" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              الدخول بحساب Google
            </a>
          </>
        )}
      </form>
    </main>
  );
}
