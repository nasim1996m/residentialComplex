'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Apartment, OccupancyStatus } from '@/lib/types';
import { Building2, Home, Car, ParkingSquare, User, CheckCircle2, XCircle, AlertTriangle, Layers } from 'lucide-react';

export function BuildingGrid() {
  const { buildings, selectedBuildingId, setSelectedBuildingId, setSelectedApartment } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId) || buildings[0];

  if (!selectedBuilding) {
    return <div className="p-8 text-center text-gray-400">جاري تحميل البنايات...</div>;
  }

  // Filter apartments if filter active
  const filteredApartments = selectedBuilding.apartments.filter((apt) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'OCCUPIED') return apt.isOccupied;
    if (statusFilter === 'VACANT_SOLD') return apt.occupancyStatus === 'VACANT_SOLD';
    if (statusFilter === 'UNSOLD') return apt.occupancyStatus === 'VACANT_UNSOLD';
    return true;
  });

  // Group apartments by floor (Floors 5 down to 1 for visual stack)
  const floorMap: { [key: number]: Apartment[] } = { 5: [], 4: [], 3: [], 2: [], 1: [] };
  filteredApartments.forEach((apt) => {
    if (floorMap[apt.floorNumber]) {
      floorMap[apt.floorNumber].push(apt);
    }
  });

  const getStatusBadge = (apt: Apartment) => {
    if (apt.occupancyStatus === 'OWNER_OCCUPIED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md badge-occupied-owner">
          <CheckCircle2 className="w-3 h-3" /> مسكونة (مالك)
        </span>
      );
    }
    if (apt.occupancyStatus === 'RENTED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md badge-occupied-rented">
          <User className="w-3 h-3" /> مسكونة (مستأجر)
        </span>
      );
    }
    if (apt.occupancyStatus === 'VACANT_SOLD') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md badge-vacant-sold">
          <AlertTriangle className="w-3 h-3" /> مباعة - فارغة
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md badge-vacant-unsold">
        <XCircle className="w-3 h-3" /> غير مباعة
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Building Selector Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 glass-card p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {buildings.map((b) => {
            const isSelected = b.id === selectedBuildingId;
            const isConstruction = b.status === 'UNDER_CONSTRUCTION';

            return (
              <button
                key={b.id}
                onClick={() => setSelectedBuildingId(b.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : isConstruction
                    ? 'bg-red-950/40 text-red-400 border border-red-800/40 hover:bg-red-900/40'
                    : 'bg-slate-900/60 text-gray-400 border border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>{b.name}</span>
                {isConstruction && (
                  <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-mono">قيد الإنشاء</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-bold">تصفية الشقق:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">جميع الشقق (20 شقة)</option>
            <option value="OCCUPIED">المسكونة فقط (تستحق الاشتراكات)</option>
            <option value="VACANT_SOLD">المباعة والفارغة</option>
            <option value="UNSOLD">غير المباعة</option>
          </select>
        </div>
      </div>

      {/* Building Under Construction Banner */}
      {selectedBuilding.status === 'UNDER_CONSTRUCTION' ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-red-500/20 bg-red-950/10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-white">{selectedBuilding.name} - قيد الإنشاء</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            هذه البناية قيد الهيكل الخرساني والإنشاء حالياً. تتكون من 5 طوابق و 20 شقة قيد الهيكلة، وسيتم تفعيل حجز الشقق والاشتراكات فور التسليم.
          </p>
        </div>
      ) : (
        /* Visual 5-Floor Grid */
        <div className="space-y-4">
          
          {/* Legend Header */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-2">
            <span className="font-bold flex items-center gap-2 text-white">
              <Layers className="w-4 h-4 text-blue-400" /> مخطط طوابق {selectedBuilding.name} (5 طوابق × 4 شقق)
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-green-400"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> مسكونة (تستحق الخدمة)</span>
              <span className="flex items-center gap-1.5 text-yellow-400"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> مباعة فارغة</span>
              <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span> غير مباعة</span>
            </div>
          </div>

          {/* Floors Stack (Floor 5 down to 1) */}
          {[5, 4, 3, 2, 1].map((floorNum) => {
            const floorApartments = floorMap[floorNum] || [];

            return (
              <div key={floorNum} className="glass-card p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-gray-800/60 pb-2">
                  <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                    الطابق 0{floorNum}
                  </span>
                  <span className="text-xs text-gray-400">4 شقق في الطابق</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {floorApartments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedApartment(apt)}
                      className="glass-card-hover glass-card p-4 rounded-xl cursor-pointer space-y-3 relative group border border-slate-800"
                    >
                      {/* Apartment Code & Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">
                          {apt.sequentialCode}
                        </span>
                        {getStatusBadge(apt)}
                      </div>

                      {/* Resident Info or Price */}
                      {apt.contractOwner ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-400" /> {apt.contractOwner.fullName}
                          </p>
                          <p className="text-[11px] text-gray-400 dir-ltr text-right">
                            {apt.contractOwner.phone}
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 font-semibold">
                          سعر الشقة: <span className="text-white font-bold">${apt.price.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Details Strip (Vehicles & Garage) */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-[11px] text-gray-400">
                        <div className="flex items-center gap-1 text-gray-300">
                          <Car className="w-3.5 h-3.5 text-amber-400" />
                          <span>{apt.vehicles.length} سيارات</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-300">
                          <ParkingSquare className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{apt.garageSpots.length} موقف</span>
                        </div>
                        {apt.isOccupied ? (
                          <span className="text-green-400 text-[10px] font-bold bg-green-500/10 px-1.5 py-0.5 rounded">اشتراك مفعل</span>
                        ) : (
                          <span className="text-gray-500 text-[10px]">اشتراك معطل</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
