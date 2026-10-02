'use client';

import React, { useState } from 'react';
import { currentPeriod } from '@/lib/api';
import { useApp } from '@/lib/store';
import { UserCheck, Shield, CheckCircle2, AlertCircle, Phone, Mail, Building, Car, ParkingSquare, Users } from 'lucide-react';

export function StaffPortal() {
  const { me, staff, toggleStaffDuty, buildings, setSelectedApartment, generateCharges, summary } = useApp();
  const [query, setQuery] = useState('');
  const [billingResult, setBillingResult] = useState<string | null>(null);

  // Super admins can open this portal too; they have no staff profile of their own.
  const currentStaff =
    staff.find((s) => s.id === me.id) ??
    (me.role === 'SUPER_ADMIN'
      ? { id: me.id, fullName: me.fullName, email: me.email, phone: '', gender: '', role: me.role, department: 'الإدارة العامة', isOnDuty: true, avatarUrl: undefined }
      : undefined);

  const allApartments = buildings.flatMap((b) => b.apartments);
  const occupiedApartments = allApartments.filter((a) => a.isOccupied);
  const q = query.trim().toLowerCase();
  const visibleApartments = allApartments
    .filter((a) => a.isSold)
    .filter(
      (a) =>
        !q ||
        a.sequentialCode.toLowerCase().includes(q) ||
        a.contractOwner?.fullName.toLowerCase().includes(q) ||
        a.contractOwner?.phone.includes(q),
    );
  const vacantSoldApartments = allApartments.filter((a) => a.occupancyStatus === 'VACANT_SOLD');

  if (!currentStaff) {
    return (
      <div className="glass-card p-12 text-center rounded-3xl border border-slate-800 my-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-white">جاري تحميل بيانات الموظف...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-3xl border border-blue-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-blue-500/40 flex items-center justify-center text-2xl font-black text-blue-300">
            {currentStaff.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{currentStaff.fullName}</h2>
              <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                {currentStaff.department}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">بوابة الموظف الإداري لمتابعة اشتراكات السكان وتثبيت حالات الشقق والتحصيل</p>
          </div>
        </div>

        {/* On-Duty Switch */}
        <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-gray-300">حالة التواجد بالدوام:</span>
          <button
            onClick={() => toggleStaffDuty(currentStaff.id).catch(() => {})}
            disabled={me.role === 'SUPER_ADMIN'}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              currentStaff.isOnDuty
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {currentStaff.isOnDuty ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> متواجد بالخدمة (On-Duty)
              </>
            ) : (
              'غير متواجد (Off-Duty)'
            )}
          </button>
        </div>
      </div>

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-gray-400 font-bold block mb-1">الشقق المسكونة وتستحق الاشتراكات</span>
          <p className="text-2xl font-black text-green-400">{occupiedApartments.length} شقة</p>
          <span className="text-[11px] text-gray-500">
            فواتير غير مدفوعة: {summary?.unpaidSubscriptionCharges.count ?? 0} (${(summary?.unpaidSubscriptionCharges.amount ?? 0).toLocaleString()})
          </span>
        </div>

        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-gray-400 font-bold block mb-1">شقق مباعة فارغة (معفاة)</span>
          <p className="text-2xl font-black text-amber-400">{vacantSoldApartments.length} شقة</p>
          <span className="text-[11px] text-gray-500">لا تستحق خدمات التشغيل اليومي</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <span className="text-xs text-gray-400 font-bold block mb-1">إجمالي السيارات المسجلة بالمجمع</span>
          <p className="text-2xl font-black text-blue-400">
            {allApartments.reduce((acc, a) => acc + a.vehicles.length, 0)} سيارات
          </p>
          <span className="text-[11px] text-gray-500">مزودة بباجات دخول RFID</span>
        </div>
      </div>

      {/* Residents Verification & Subscriptions Tracking Table */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-400" /> سجلات السكّان والعقود والاشتراكات
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">انقر على الشقة لتسجيل الدفعات أو تعديل سيارات وكراج الساكن</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder="بحث بالرمز أو الاسم أو الهاتف"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
            />
            <button
              onClick={async () => {
                try {
                  const period = currentPeriod();
                  const r = await generateCharges(period);
                  setBillingResult(`تم إصدار ${r.created} فاتورة لشهر ${period}`);
                } catch {
                  // error shown via store
                }
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
            >
              إصدار فواتير الشهر
            </button>
          </div>
        </div>
        {billingResult && <p className="text-xs text-blue-300 font-bold">{billingResult}</p>}

        {visibleApartments.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            لا توجد شقق مباعة مطابقة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-gray-300">
              <thead className="bg-slate-900/90 text-gray-400 uppercase text-[11px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">رمز الشقة</th>
                  <th className="p-3.5">اسم الساكن / صاحب العقد</th>
                  <th className="p-3.5">حالة السكن والخدمة</th>
                  <th className="p-3.5">السيارات المسجلة</th>
                  <th className="p-3.5">مواقف الكراج</th>
                  <th className="p-3.5">قيمة الاشتراكات الشهريّة</th>
                  <th className="p-3.5">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {visibleApartments.map((apt) => {
                  const subTotal = apt.subscriptions.reduce((acc, s) => acc + s.monthlyPrice, 0);

                  return (
                    <tr key={apt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-black text-white">{apt.sequentialCode}</td>
                      <td className="p-3.5">
                        {apt.contractOwner ? (
                          <div>
                            <span className="font-bold text-white block">{apt.contractOwner.fullName}</span>
                            <span className="text-[10px] text-gray-400 dir-ltr">{apt.contractOwner.phone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">غير محدد</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {apt.isOccupied ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded badge-occupied-owner">
                            <CheckCircle2 className="w-3 h-3" /> مسكونة (تستحق)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded badge-vacant-sold">
                            مباعة فارغة (معفاة)
                          </span>
                        )}
                        {(apt.financials.overdueInstallments > 0 || apt.unpaidCharges.length > 0) && (
                          <span className="block text-[10px] text-red-400 mt-1">
                            {apt.financials.overdueInstallments > 0 && `${apt.financials.overdueInstallments} قسط متأخر `}
                            {apt.unpaidCharges.length > 0 && `${apt.unpaidCharges.length} فاتورة غير مدفوعة`}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          <Car className="w-3.5 h-3.5" /> {apt.vehicles.length} سيارة
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-indigo-400 flex items-center gap-1">
                          <ParkingSquare className="w-3.5 h-3.5" /> {apt.garageSpots.length} موقف
                        </span>
                      </td>
                      <td className="p-3.5 font-black text-green-400">${subTotal} / شهرياً</td>
                      <td className="p-3.5">
                        <button
                          onClick={() => setSelectedApartment(apt)}
                          className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all border border-blue-500/30"
                        >
                          عرض وتعديل
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
