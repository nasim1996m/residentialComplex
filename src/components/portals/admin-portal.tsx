'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { BuildingGrid } from '@/components/building-grid';
import {
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Plus,
  Trash2,
  UserPlus,
  Home,
  X,
  RotateCcw,
} from 'lucide-react';

export function AdminPortal() {
  const {
    buildings,
    services,
    staff,
    addStaffMember,
    removeStaffMember,
    toggleServiceAvailability,
    toggleStaffDuty,
    registerApartmentSale,
    resetToEmptyState,
  } = useApp();

  // Modal states for adding staff
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffGender, setStaffGender] = useState('ذكر');
  const [staffDepartment, setStaffDepartment] = useState('قسم الحسابات والاشتراكات');

  // Modal states for registering apartment sale/lease
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedAptId, setSelectedAptId] = useState('');
  const [resName, setResName] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resGender, setResGender] = useState('ذكر');
  const [paymentType, setPaymentType] = useState<'FULL_CASH' | 'INSTALLMENTS'>('FULL_CASH');
  const [occupancyStatus, setOccupancyStatus] = useState<'OWNER_OCCUPIED' | 'RENTED' | 'VACANT_SOLD'>('OWNER_OCCUPIED');

  // Flatten all apartments
  const allApartments = buildings.flatMap((b) => b.apartments);

  let totalApartments = 0;
  let occupiedCount = 0;
  let vacantSoldCount = 0;
  let totalRevenue = 0;

  buildings.forEach((b) => {
    b.apartments.forEach((apt) => {
      totalApartments++;
      if (apt.isOccupied) occupiedCount++;
      if (apt.occupancyStatus === 'VACANT_SOLD') vacantSoldCount++;
      if (apt.isSold) totalRevenue += apt.price;
    });
  });

  const occupancyRate = totalApartments > 0 ? Math.round((occupiedCount / totalApartments) * 100) : 0;

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffPhone) return;

    addStaffMember({
      fullName: staffName,
      email: staffEmail || `${Date.now()}@complex.com`,
      phone: staffPhone,
      gender: staffGender,
      department: staffDepartment,
      avatarUrl: staffGender === 'ذكر'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    });

    setStaffName('');
    setStaffEmail('');
    setStaffPhone('');
    setShowStaffModal(false);
  };

  const handleRegisterSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAptId || !resName || !resPhone) return;

    registerApartmentSale(
      selectedAptId,
      {
        fullName: resName,
        email: resEmail || `resident.${Date.now()}@complex.com`,
        phone: resPhone,
        gender: resGender,
        isContractOwner: true,
        familyMembersCount: 2,
        hasAccessBadge: true,
        badgeCode: `RFID-PASS-${Math.floor(100000 + Math.random() * 900000)}`,
      },
      paymentType,
      occupancyStatus
    );

    setResName('');
    setResEmail('');
    setResPhone('');
    setSelectedAptId('');
    setShowSaleModal(false);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-400" /> لوحة تحكم مالك المجمع (Super Admin)
          </h2>
          <p className="text-sm text-gray-400 mt-1">المجمع خالٍ وجاهز - يمكنك إضافة الموظفين وتسجيل بيع وتأجير الشقق بنفسك</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStaffModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> إضافة موظف جديد
          </button>

          <button
            onClick={() => setShowSaleModal(true)}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-green-600/30 flex items-center gap-2"
          >
            <Home className="w-4 h-4" /> تسجيل بيع / تأجير شقة
          </button>

          <button
            onClick={resetToEmptyState}
            className="p-2.5 bg-slate-900 border border-slate-800 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
            title="تفريغ كافة البيانات وإعادة الضبط"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="glass-card p-5 rounded-2xl space-y-2 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">إجمالي المبيعات والإيرادات</span>
            <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">${totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-green-400 font-semibold flex items-center gap-1">
            {allApartments.filter((a) => a.isSold).length} شقة مباعة مسجلة
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-2 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">نسبة السكن المفعّل</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{occupancyRate}%</p>
          <p className="text-xs text-blue-400 font-semibold">
            {occupiedCount} شقة مسكونة من أصل {totalApartments} شقة
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-2 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">شقق مباعة (فارغة بدون سكن)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{vacantSoldCount} شقة</p>
          <p className="text-xs text-amber-400 font-semibold">معفاة من اشتراكات الخدمات اليومية</p>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-2 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">عدد الموظفين المسجلين بالنظام</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{staff.length} موظفاً</p>
          <p className="text-xs text-purple-400 font-semibold">
            {staff.filter((s) => s.isOnDuty).length} متواجدون بالدوام
          </p>
        </div>

      </div>

      {/* Interactive 5-Floor x 4-Apartment Visual Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" /> خريطة البنايات الـ 7 والشقق
          </h3>
          <span className="text-xs text-gray-400">انقر على أي شقة لعرض بياناتها وتعديل الساكن والسيارات والكراج</span>
        </div>
        <BuildingGrid />
      </section>

      {/* Staff & Services Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Administrative Staff Table */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> قائمة الموظفين المسجلين بالنظام ({staff.length})
            </h4>
            <button
              onClick={() => setShowStaffModal(true)}
              className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> إضافة موظف
            </button>
          </div>

          {staff.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 space-y-2">
              <Users className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="font-bold text-white">لا يوجد موظفون مضافون حالياً</p>
              <p>قم بالنقر على "إضافة موظف جديد" في الأعلى لإدخال كادرك الإداري والفني.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staff.map((s) => (
                <div key={s.id} className="flex items-center justify-between bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <img src={s.avatarUrl} alt={s.fullName} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <h5 className="text-xs font-black text-white">{s.fullName}</h5>
                      <p className="text-[11px] text-gray-400">{s.department} | {s.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStaffDuty(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        s.isOnDuty
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}
                    >
                      {s.isOnDuty ? 'متواجد 🟢' : 'غائب 🔴'}
                    </button>

                    <button
                      onClick={() => removeStaffMember(s.id)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="حذف الموظف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complex Services Catalog */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" /> قائمة الخدمات والاشتراكات المتاحة
            </h4>
            <span className="text-xs text-gray-400">التوفر وتكاليف الاشتراك</span>
          </div>

          <div className="space-y-3">
            {services.map((srv) => (
              <div key={srv.id} className="flex items-center justify-between bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <h5 className="text-xs font-black text-white">{srv.name}</h5>
                  <p className="text-[11px] text-gray-400">يتم تفعيلها تلقائياً على الشقق المسكونة</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-green-400">${srv.monthlyPrice} / شهرياً</span>
                  <button
                    onClick={() => toggleServiceAvailability(srv.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      srv.isAvailable
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {srv.isAvailable ? 'متاحة' : 'معطلة'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL 1: ADD STAFF MEMBER */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" /> إضافة موظف جديد للنظام
              </h3>
              <button onClick={() => setShowStaffModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">الاسم الكامل للموظف:</label>
                <input
                  type="text"
                  placeholder="مثال: علي كريم البصري"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  placeholder="+964 770 123 4567"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  placeholder="employee@complex.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">الجنس:</label>
                  <select
                    value={staffGender}
                    onChange={(e) => setStaffGender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">القسم / التخصص:</label>
                  <select
                    value={staffDepartment}
                    onChange={(e) => setStaffDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  >
                    <option value="قسم الحسابات والاشتراكات">الحسابات والتحصيل (Staff)</option>
                    <option value="خدمة السكان والتعاقد">خدمة السكان والتعاقد (Staff)</option>
                    <option value="أمن البوابات والكراجات">أمن البوابات (Security)</option>
                    <option value="صيانة عامة وفريلانس">صيانة وفريلانس (Worker)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/30 mt-2"
              >
                تسجيل الموظف وتفعيل حسابه
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER APARTMENT SALE / RESIDENT */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Home className="w-5 h-5 text-green-400" /> تسجيل بيع أو إيجار شقة لساكن جديد
              </h3>
              <button onClick={() => setShowSaleModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSaleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">اختر الشقة المراد بيعها/تأجيرها:</label>
                <select
                  value={selectedAptId}
                  onChange={(e) => setSelectedAptId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  required
                >
                  <option value="">-- اختر شقة فارغة --</option>
                  {allApartments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.sequentialCode} (بناية {a.buildingNumber} - طابق {a.floorNumber}) - ${a.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">اسم الساكن / صاحب العقد الكامل:</label>
                <input
                  type="text"
                  placeholder="مثال: د. ياسر أحمد الحمداني"
                  value={resName}
                  onChange={(e) => setResName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    placeholder="+964 770 000 1122"
                    value={resPhone}
                    onChange={(e) => setResPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    placeholder="resident@gmail.com"
                    value={resEmail}
                    onChange={(e) => setResEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">نظام الدفع:</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  >
                    <option value="FULL_CASH">دفعة كاملة (Cash)</option>
                    <option value="INSTALLMENTS">أقساط شهرية (Installments)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">حالة السكن الحالية:</label>
                  <select
                    value={occupancyStatus}
                    onChange={(e) => setOccupancyStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  >
                    <option value="OWNER_OCCUPIED">مسكونة بواسطة المالك (تستحق الخدمة)</option>
                    <option value="RENTED">مستأجرة ومسكونة (تستحق الخدمة)</option>
                    <option value="VACANT_SOLD">مباعة وتركها فارغة (معفاة)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-green-600/30 mt-2"
              >
                إتمام العقد وتفعيل العضوية والاشتراك
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
