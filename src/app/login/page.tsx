'use client';

import React, { useState } from 'react';
import { Building2, LogIn } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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
      </form>
    </main>
  );
}
