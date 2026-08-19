'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { Wrench, CheckCircle2, Clock, AlertTriangle, Building, Phone } from 'lucide-react';

export function WorkerPortal() {
  const { tickets, updateTicketStatus } = useApp();

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl border border-amber-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-400" /> بوابة عمال الصيانة والفريلانس (Workers Portal)
          </h2>
          <p className="text-xs text-gray-400 mt-1">استقبال طلبات صيانة الشقق، التحرك الميداني وتغيير حالة الإنجاز</p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl text-xs font-bold text-amber-400">
          عدد الطلبات النشطة: {tickets.filter((t) => t.status !== 'RESOLVED').length} بلاغات
        </div>
      </div>

      {/* Maintenance Tickets Board */}
      <div className="glass-card p-6 rounded-3xl space-y-6">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" /> قائمة المهام والبلاغات الصادرة من السكّان
        </h3>

        {tickets.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            لا توجد طلبات صيانة مقدمة حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tickets.map((t) => (
              <div key={t.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 relative flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" /> شقة {t.apartmentCode}
                    </span>
                    
                    {t.status === 'PENDING' && (
                      <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                        قيد الانتظار
                      </span>
                    )}
                    {t.status === 'IN_PROGRESS' && (
                      <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                        قيد التنفيذ الميداني
                      </span>
                    )}
                    {t.status === 'RESOLVED' && (
                      <span className="text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded">
                        مكتمل ومستلم
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-black text-white">{t.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{t.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="text-[11px] text-gray-500 flex items-center justify-between">
                    <span>الفني الموكل: <strong className="text-gray-300">{t.workerName || 'غير محدد'}</strong></span>
                    <span>{t.createdAt}</span>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-2">
                    {t.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateTicketStatus(t.id, 'IN_PROGRESS')}
                        className="flex-1 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all border border-blue-500/30"
                      >
                        بدء التنفيذ
                      </button>
                    )}
                    {t.status !== 'RESOLVED' && (
                      <button
                        onClick={() => updateTicketStatus(t.id, 'RESOLVED')}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-green-600/20"
                      >
                        تم الإنجاز ✓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
