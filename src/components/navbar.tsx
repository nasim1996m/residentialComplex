'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, ShieldCheck, UserCheck, Wrench, User, Sparkles, LogOut, KeyRound, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { api } from '@/lib/api';
import type { Role } from '@/lib/types';

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'المالك / الأدمن',
  ADMIN_STAFF: 'موظف إداري',
  MAINTENANCE_WORKER: 'عامل صيانة',
  RESIDENT: 'ساكن',
};

const LINKS: { href: string; label: string; icon: React.ReactNode; roles: Role[] }[] = [
  { href: '/admin', label: 'لوحة الأدمن', icon: <ShieldCheck className="w-4 h-4" />, roles: ['SUPER_ADMIN'] },
  { href: '/staff', label: 'الموظفين', icon: <UserCheck className="w-4 h-4" />, roles: ['SUPER_ADMIN', 'ADMIN_STAFF'] },
  { href: '/worker', label: 'الصيانة', icon: <Wrench className="w-4 h-4" />, roles: ['SUPER_ADMIN', 'ADMIN_STAFF', 'MAINTENANCE_WORKER'] },
  { href: '/resident', label: 'شقتي', icon: <User className="w-4 h-4" />, roles: ['RESIDENT'] },
];

export function Navbar() {
  const { me } = useApp();
  const pathname = usePathname();
  const [showPassword, setShowPassword] = useState(false);

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-40 glass-card border-b border-gray-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">نظام المجمعات السكنية</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles className="w-3 h-3" /> الذكي Pro
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">إدارة الشقق والاشتراكات والكراجات والموظفين</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          {LINKS.filter((l) => l.roles.includes(me.role)).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                pathname === l.href ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {l.icon}
              <span className="hidden sm:inline">{l.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-white">{me.fullName}</p>
            <p className="text-[10px] text-gray-400">{ROLE_LABEL[me.role]}</p>
          </div>
          <button onClick={() => setShowPassword(true)} title="تغيير كلمة المرور" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-400 hover:text-white">
            <KeyRound className="w-4 h-4" />
          </button>
          <button onClick={logout} title="تسجيل الخروج" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-red-400 hover:text-red-300">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
    </header>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/auth/password', { method: 'POST', body: { currentPassword, newPassword } });
      window.location.href = '/login';
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <form onSubmit={submit} className="glass-card bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white">تغيير كلمة المرور</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && <p className="text-xs text-red-400 font-bold">{error}</p>}
        <input type="password" placeholder="كلمة المرور الحالية" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white" required />
        <input type="password" placeholder="كلمة المرور الجديدة (10 أحرف على الأقل)" value={newPassword} onChange={(e) => setNew(e.target.value)} autoComplete="new-password" minLength={10} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white" required />
        <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl">حفظ وتسجيل الخروج من كل الأجهزة</button>
      </form>
    </div>
  );
}
