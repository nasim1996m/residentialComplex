'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { Role } from '@/lib/types';
import { Building2, ShieldCheck, UserCheck, Wrench, User, Sparkles } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { GoogleAuthButton } from './google-auth-button';

export function Navbar() {
  const { currentRole, setCurrentRole } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const roleOptions: { id: Role; label: string; icon: React.ReactNode; color: string; path: string }[] = [
    {
      id: 'SUPER_ADMIN',
      label: 'المالك / الأدمن (Admin)',
      icon: <ShieldCheck className="w-4 h-4" />,
      color: 'from-blue-600 to-indigo-600',
      path: '/admin',
    },
    {
      id: 'ADMIN_STAFF',
      label: 'الموظفين - إداري (Staff)',
      icon: <UserCheck className="w-4 h-4" />,
      color: 'from-emerald-600 to-teal-600',
      path: '/staff',
    },
    {
      id: 'MAINTENANCE_WORKER',
      label: 'عمال - فريلانس (Workers)',
      icon: <Wrench className="w-4 h-4" />,
      color: 'from-amber-600 to-orange-600',
      path: '/worker',
    },
    {
      id: 'RESIDENT',
      label: 'الساكن / صاحب الشقة (Resident)',
      icon: <User className="w-4 h-4" />,
      color: 'from-purple-600 to-pink-600',
      path: '/resident',
    },
  ];

  const handleRoleSelect = (roleId: Role, path: string) => {
    setCurrentRole(roleId);
    if (pathname !== '/' && pathname !== path) {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-gray-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">نظام المجمعات السكنية</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles className="w-3 h-3" /> الذكي Pro
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">إدارة الشقق والاشتراكات والكراجات والموظفين</p>
          </div>
        </div>

        {/* Right Section: Role Switcher & Google Login */}
        <div className="flex items-center gap-3">
          {/* Dynamic Role Switcher */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-gray-400 px-3 hidden md:inline">تبديل لوحة التحكم:</span>
            {roleOptions.map((role) => {
              const isActive = currentRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id, role.path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${role.color} text-white shadow-md shadow-blue-900/30 scale-[1.02]`
                      : 'text-gray-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {role.icon}
                  <span className="hidden sm:inline">{role.label}</span>
                </button>
              );
            })}
          </div>

          {/* Google Auth Button */}
          <GoogleAuthButton />
        </div>

      </div>
    </header>
  );
}
