'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { User, Car, ParkingSquare, CreditCard, ShieldCheck, Plus, CheckCircle2, Wrench, FileText, BadgeCheck, Home } from 'lucide-react';

export function ResidentPortal() {
  const { buildings, addVehicleToApartment, removeVehicleFromApartment, createMaintenanceTicket } = useApp();

  const soldApartment = buildings.flatMap((b) => b.apartments).find((a) => a.isSold && a.contractOwner);

  // Forms
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('');

  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  if (!soldApartment || !soldApartment.contractOwner) {
    return (
      <div className="glass-card p-12 text-center rounded-3xl border border-slate-800 my-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20">
          <Home className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-white">لم يتم تسجيل أي شقة مباعة أو ساكن بعد</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          قم بالتبديل إلى لوحة <strong>"المالك / الأدمن"</strong> في شريط التنقل العلوي واستخدم زر <strong>"تسجيل بيع / تأجير شقة"</strong> لإدخال ساكن جديد واختبار هذه الشاشة.
        </p>
      </div>
    );
  }

  const myApartment = soldApartment;
  const owner = soldApartment.contractOwner;

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newModel) return;

    addVehicleToApartment(myApartment.id, {
      apartmentId: myApartment.id,
      plateNumber: newPlate,
      makeModel: newModel,
      color: newColor || 'غير محدد',
      rfidBadgeCode: `RFID-RES-${Math.floor(100000 + Math.random() * 900000)}`,
    });

    setNewPlate('');
    setNewModel('');
    setNewColor('');
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle || !ticketDesc) return;

    createMaintenanceTicket({
      apartmentId: myApartment.id,
      apartmentCode: myApartment.sequentialCode,
      title: ticketTitle,
      description: ticketDesc,
      status: 'PENDING',
    });

    setTicketTitle('');
    setTicketDesc('');
    setTicketSubmitted(true);
    setTimeout(() => setTicketSubmitted(false), 3000);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Resident Welcome Banner */}
      <div className="glass-card p-6 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <img
            src={owner.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
            alt={owner.fullName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/40 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{owner.fullName}</h2>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5" /> صاحب العقد الأصلي
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              شقتك: <strong className="text-white">{myApartment.sequentialCode}</strong> (بناية {myApartment.buildingNumber} - طابق {myApartment.floorNumber})
            </p>
          </div>
        </div>

        <div className="bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-800 text-xs text-right space-y-1">
          <span className="text-gray-400 block">حالة الشقة الحالية:</span>
          <span className="font-black text-green-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> مسكونة بواسطة المالك (الاشتراكات مفعّلة)
          </span>
        </div>
      </div>

      {/* Grid: Vehicles & Garage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Vehicles Section */}
        <div className="glass-card p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-amber-400" /> السيارات المسجلة لشقتك ({myApartment.vehicles.length})
            </h3>
            <span className="text-xs text-gray-400">مزودة بشريحة دخول تلقائي</span>
          </div>

          <div className="space-y-3">
            {myApartment.vehicles.map((v) => (
              <div key={v.id} className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">{v.makeModel}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">اللوحة: <span className="text-white font-bold">{v.plateNumber}</span> | اللون: {v.color}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded font-mono font-bold block">
                    {v.rfidBadgeCode}
                  </span>
                  <button
                    onClick={() => removeVehicleFromApartment(myApartment.id, v.id)}
                    className="text-[11px] text-red-400 hover:underline mt-1 inline-block"
                  >
                    حذف السيارة
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Car Form */}
          <form onSubmit={handleAddVehicle} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-400" /> إضافة سيارة ثانية أو جديدة
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="رقم اللوحة"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="نوع وتحديد السيارة"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="اللون"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              حفظ وتوليد شريحة الدخول
            </button>
          </form>
        </div>

        {/* Garage Spots & Subscriptions */}
        <div className="space-y-6">
          
          {/* Garage Spots Card */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <ParkingSquare className="w-5 h-5 text-indigo-400" /> مواقف الكراج المخصصة ({myApartment.garageSpots.length})
              </h3>
              <span className="text-xs text-gray-400">تفتح البوابة الإلكترونية تلقائياً</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myApartment.garageSpots.map((g) => (
                <div key={g.id} className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white">{g.spotNumber}</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">
                      {g.zoneFloor}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono">باركود البوابة: {g.accessBarcode}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Subscriptions Card */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400" /> مستحقات الاشتراكات الشهرية
              </h3>
              <span className="text-xs font-black text-green-400">
                إجمالي الدفع: ${myApartment.subscriptions.reduce((acc, s) => acc + s.monthlyPrice, 0)} / شهرياً
              </span>
            </div>

            <div className="space-y-2">
              {myApartment.subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="font-bold text-white">{sub.serviceName}</span>
                  <span className="font-black text-green-400">${sub.monthlyPrice} / شهر</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Maintenance Request Form */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-400" /> تقديم طلب صيانة عاجلة أو خدمة لشقتك
        </h3>

        {ticketSubmitted && (
          <div className="p-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl text-xs font-bold text-center">
            تم إرسال طلب الصيانة بنجاح إلى الفنيين والعمال المعنيين!
          </div>
        )}

        <form onSubmit={handleCreateTicket} className="space-y-3">
          <input
            type="text"
            placeholder="عنوان البلاغ (مثال: تسريب مياه أو عطل بالكهرباء)"
            value={ticketTitle}
            onChange={(e) => setTicketTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            required
          />
          <textarea
            placeholder="تفاصيل العطل والوقت المناسب لزيارة الفني..."
            value={ticketDesc}
            onChange={(e) => setTicketDesc(e.target.value)}
            rows={3}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            required
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-600/30"
          >
            إرسال البلاغ للفريلانس والفنيين
          </button>
        </form>
      </div>

    </div>
  );
}
