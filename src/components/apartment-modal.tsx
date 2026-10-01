'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { OccupancyStatus } from '@/lib/types';
import {
  X,
  Building,
  User,
  Car,
  ParkingSquare,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  FileText,
  BadgeCheck,
  Check,
} from 'lucide-react';

export function ApartmentModal() {
  const {
    selectedApartment,
    setSelectedApartment,
    updateApartmentOccupancy,
    addVehicleToApartment,
    removeVehicleFromApartment,
    addGarageSpotToApartment,
    payInstallment,
    payCharge,
    error,
  } = useApp();
  const [busy, setBusy] = useState(false);

  const [activeTab, setActiveTab] = useState<'DETAILS' | 'VEHICLES' | 'GARAGE' | 'FINANCIAL'>('DETAILS');

  // Form states for vehicle adding
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('');

  // Form states for garage adding
  const [newSpotNumber, setNewSpotNumber] = useState('');
  const [newZoneFloor, setNewZoneFloor] = useState('السرداب - طابق 1');

  if (!selectedApartment) return null;

  const apt = selectedApartment;

  // Errors are already surfaced through the store; this only tracks the in-flight state.
  const act = async (fn: () => Promise<void>) => {
    if (busy) return false;
    setBusy(true);
    try {
      await fn();
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleOccupancyChange = (newStatus: OccupancyStatus) => {
    if (newStatus === apt.occupancyStatus) return;
    act(() => updateApartmentOccupancy(apt.id, newStatus));
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newModel) return;
    const ok = await act(() =>
      addVehicleToApartment(apt.id, { plateNumber: newPlate, makeModel: newModel, color: newColor || undefined }),
    );
    if (ok) {
      setNewPlate('');
      setNewModel('');
      setNewColor('');
    }
  };

  const handleAddGarage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpotNumber) return;
    const ok = await act(() => addGarageSpotToApartment(apt.id, { spotNumber: newSpotNumber, zoneFloor: newZoneFloor }));
    if (ok) setNewSpotNumber('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{apt.sequentialCode}</h2>
                <span className="text-xs font-semibold text-gray-400 bg-slate-800 px-2.5 py-0.5 rounded-md">
                  بناية {apt.buildingNumber} - طابق {apt.floorNumber}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">تفاصيل الشقة والاشتراكات والسيارات والكراج</p>
            </div>
          </div>

          <button
            onClick={() => setSelectedApartment(null)}
            className="w-9 h-9 rounded-full bg-slate-800 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Header */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('DETAILS')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'DETAILS'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <User className="w-4 h-4" /> تفاصيل الساكن وحالة السكن
          </button>

          <button
            onClick={() => setActiveTab('VEHICLES')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'VEHICLES'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Car className="w-4 h-4" /> السيارات المسجلة ({apt.vehicles.length})
          </button>

          <button
            onClick={() => setActiveTab('GARAGE')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'GARAGE'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ParkingSquare className="w-4 h-4" /> مواقف الكراج ({apt.garageSpots.length})
          </button>

          <button
            onClick={() => setActiveTab('FINANCIAL')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'FINANCIAL'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <CreditCard className="w-4 h-4" /> الأقساط والاشتراكات
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div role="alert" className="p-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}
          
          {/* TAB 1: DETAILS & OCCUPANCY */}
          {activeTab === 'DETAILS' && (
            <div className="space-y-6">
              
              {/* Occupancy Status Selector Block */}
              <div className="glass-card p-5 rounded-2xl space-y-3 border-blue-500/20 bg-blue-950/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-400" /> حالة سكن الشقة (تحديد استحقاق الاشتراكات)
                  </h3>
                  {apt.isOccupied ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-green-500/10 text-green-400 border border-green-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> مسكونة - خاضعة للاشتراكات والخدمات
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                      <ShieldAlert className="w-3.5 h-3.5" /> غير مسكونة / فارغة - الاشتراكات معطلة
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <button
                    onClick={() => handleOccupancyChange('OWNER_OCCUPIED')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      apt.occupancyStatus === 'OWNER_OCCUPIED'
                        ? 'bg-green-600 text-white border-green-500 shadow-md shadow-green-900/40'
                        : 'bg-slate-900/80 text-gray-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    مسكونة بواسطة المالك
                  </button>

                  <button
                    onClick={() => handleOccupancyChange('RENTED')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      apt.occupancyStatus === 'RENTED'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/40'
                        : 'bg-slate-900/80 text-gray-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    مسكونة بواسطة مستأجر
                  </button>

                  <button
                    onClick={() => handleOccupancyChange('VACANT_SOLD')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      apt.occupancyStatus === 'VACANT_SOLD'
                        ? 'bg-yellow-600 text-white border-yellow-500 shadow-md shadow-yellow-900/40'
                        : 'bg-slate-900/80 text-gray-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    مباعة - تركها فارغة
                  </button>

                  <button
                    onClick={() => handleOccupancyChange('VACANT_UNSOLD')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      apt.occupancyStatus === 'VACANT_UNSOLD'
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-slate-900/80 text-gray-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    غير مباعة
                  </button>
                </div>
              </div>

              {/* Resident Profile Card */}
              {apt.contractOwner ? (
                <div className="glass-card p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={apt.contractOwner.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={apt.contractOwner.fullName}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/40"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white">{apt.contractOwner.fullName}</h4>
                          {apt.contractOwner.isContractOwner && (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/20">
                              <BadgeCheck className="w-3 h-3" /> صاحب العقد الأصلي
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{apt.contractOwner.email} | {apt.contractOwner.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-gray-400 block mb-1">عدد أفراد العائلة الساكنين</span>
                      <span className="font-black text-white text-sm">{apt.contractOwner.familyMembersCount} أفراد</span>
                    </div>

                    <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-gray-400 block mb-1">باج الدخول</span>
                      <span className="font-bold text-green-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {apt.contractOwner.hasAccessBadge ? 'مفعّل' : 'غير مفعّل'}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-gray-400 block mb-1">رمز باج الدخول الذكي</span>
                      <span className="font-mono text-blue-400 font-bold">{apt.contractOwner.badgeCode || 'غير محدد'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-8 text-center rounded-2xl text-gray-400 space-y-2">
                  <User className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="font-bold text-white">هذه الشقة غير مخصصة لساكن حالياً</p>
                  <p className="text-xs">يمكنك ربط مالك جديد للشقة عند إتمام عملية الشراء أو الإيجار.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MULTIPLE VEHICLES */}
          {activeTab === 'VEHICLES' && (
            <div className="space-y-6">
              
              {/* Add New Vehicle Form */}
              <form onSubmit={handleAddVehicle} className="glass-card p-5 rounded-2xl space-y-4 bg-slate-950/50">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4" /> إضافة سيارة جديدة للشقة
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="رقم اللوحة (مثال: بغداد 12345)"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="موديل السيارة (مثال: Toyota Camry 2024)"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="اللون (مثال: أبيض مروار)"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 disabled:opacity-60 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30"
                >
                  تسجيل السيارة وإصدار باج RFID
                </button>
              </form>

              {/* Registered Vehicles List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400">السيارات المسجلة حالياً للشقة ({apt.vehicles.length}):</h4>
                {apt.vehicles.length === 0 ? (
                  <div className="p-8 text-center glass-card rounded-2xl text-gray-500 text-xs">
                    لا توجد سيارات مسجلة لهذه الشقة حالياً.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {apt.vehicles.map((v) => (
                      <div key={v.id} className="glass-card p-4 rounded-xl space-y-3 relative border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-white flex items-center gap-2">
                            <Car className="w-4 h-4 text-amber-400" /> {v.makeModel}
                          </span>
                          <button
                            onClick={() => act(() => removeVehicleFromApartment(v.id))}
                            className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="حذف السيارة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-slate-800">
                          <span>رقم اللوحة: <strong className="text-white">{v.plateNumber}</strong></span>
                          <span>اللون: <strong className="text-white">{v.color}</strong></span>
                        </div>
                        <div className="bg-slate-900 px-3 py-1.5 rounded-lg text-[11px] font-mono text-blue-400 flex items-center justify-between">
                          <span>باج الدخول (RFID):</span>
                          <span>{v.rfidBadgeCode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: GARAGE SPOTS */}
          {activeTab === 'GARAGE' && (
            <div className="space-y-6">
              
              {/* Add New Garage Spot */}
              <form onSubmit={handleAddGarage} className="glass-card p-5 rounded-2xl space-y-4 bg-slate-950/50">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4" /> تخصيص موقف كراج جديد للشقة
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="رقم موقف الكراج (مثال: G1-P104B)"
                    value={newSpotNumber}
                    onChange={(e) => setNewSpotNumber(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <select
                    value={newZoneFloor}
                    onChange={(e) => setNewZoneFloor(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="السرداب - طابق 1">السرداب - طابق 1 (Basement 1)</option>
                    <option value="السرداب - طابق 2">السرداب - طابق 2 (Basement 2)</option>
                    <option value="المواقف السطحية المغطاة">المواقف السطحية المغطاة</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 disabled:opacity-60 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                >
                  ربط وتخصيص موقف الكراج
                </button>
              </form>

              {/* Garage List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400">مواقف الكراج المخصصة للشقة ({apt.garageSpots.length}):</h4>
                {apt.garageSpots.length === 0 ? (
                  <div className="p-8 text-center glass-card rounded-2xl text-gray-500 text-xs">
                    لم يتم تخصيص موقف كراج لهذه الشقة حتى الآن.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {apt.garageSpots.map((g) => (
                      <div key={g.id} className="glass-card p-4 rounded-xl space-y-3 border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-white flex items-center gap-2">
                            <ParkingSquare className="w-4 h-4 text-indigo-400" /> {g.spotNumber}
                          </span>
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">
                            {g.zoneFloor}
                          </span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-lg text-[11px] font-mono text-gray-400 flex items-center justify-between">
                          <span>باركود البوابة:</span>
                          <span className="text-white font-bold">{g.accessBarcode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: FINANCIAL & SUBSCRIPTIONS */}
          {activeTab === 'FINANCIAL' && (
            <div className="space-y-6">

              {/* Balance overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-gray-400 block mb-1">سعر الشقة</span>
                  <span className="font-black text-white">${apt.price.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-gray-400 block mb-1">أقساط مدفوعة</span>
                  <span className="font-black text-green-400">${apt.financials.paidInstallments.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-gray-400 block mb-1">المتبقي من الأقساط</span>
                  <span className="font-black text-amber-400">${apt.financials.remainingInstallments.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-gray-400 block mb-1">اشتراكات غير مدفوعة</span>
                  <span className="font-black text-red-400">${apt.financials.unpaidChargesTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Active Subscriptions Dues */}
              <div className="glass-card p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" /> الاشتراكات الشهرية المسجلة للشقة
                </h3>

                {apt.subscriptions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">
                    لا توجد اشتراكات مفعّلة حالياً لهذه الشقة (لأن الشقة غير مسكونة أو معطلة).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {apt.subscriptions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs">
                        <span className="font-bold text-white">{sub.serviceName}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-green-400">${sub.monthlyPrice} / شهرياً</span>
                          <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded font-bold">نشط</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {apt.unpaidCharges.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-red-400">فواتير اشتراك غير مدفوعة ({apt.unpaidCharges.length})</h4>
                    {apt.unpaidCharges.map((c) => (
                      <div key={c.id} className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                        <span className="text-white">
                          {c.serviceName} - <span className="font-mono">{c.period}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-red-400">${c.amount}</span>
                          <button
                            disabled={busy}
                            onClick={() => act(() => payCharge(c.id))}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-lg font-bold"
                          >
                            تسجيل الدفع
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Installment Plan Breakdown */}
              {apt.paymentType === 'INSTALLMENTS' && (
                <div className="glass-card p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> جدول أقساط الشقة ({apt.installmentMonths} شهر، دفعة مقدمة ${(apt.downPayment ?? 0).toLocaleString()})
                  </h3>

                  <div className="space-y-2">
                    {apt.installments.map((inst) => (
                      <div key={inst.id} className="flex items-center justify-between bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs">
                        <div>
                          <span className="font-bold text-white block">
                            القسط {inst.sequenceNumber}: ${inst.amount.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-gray-400">تاريخ الاستحقاق: {inst.dueDate}</span>
                        </div>

                        {inst.isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> تم السداد ({inst.paidAt})
                          </span>
                        ) : (
                          <button
                            disabled={busy}
                            onClick={() => act(() => payInstallment(inst.id))}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-green-600 hover:text-white disabled:opacity-60 text-xs font-bold border border-amber-500/20"
                          >
                            قيد الانتظار - تسجيل الدفع
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
