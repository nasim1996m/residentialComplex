import { Building, Service, StaffProfile, MaintenanceTicket } from './types';

export const INITIAL_SERVICES: Service[] = [
  { id: 'srv-1', name: 'الحراسة والأمن (Security)', monthlyPrice: 50, isAvailable: true, subscribedCount: 0 },
  { id: 'srv-2', name: 'النظافة العامة وتجميع النفايات (Sanitation)', monthlyPrice: 40, isAvailable: true, subscribedCount: 0 },
  { id: 'srv-3', name: 'صيانة المصاعد الكهروميكانيكية (Elevator Maint.)', monthlyPrice: 60, isAvailable: true, subscribedCount: 0 },
  { id: 'srv-4', name: 'خدمات المسبح والحدائق (Pool & Gardens)', monthlyPrice: 35, isAvailable: true, subscribedCount: 0 },
  { id: 'srv-5', name: 'إنترنت الألياف الضوئية المشترك (Fiber Wifi)', monthlyPrice: 25, isAvailable: true, subscribedCount: 0 },
];

// Empty Initial Staff (Admin will add them dynamically)
export const INITIAL_STAFF: StaffProfile[] = [];

// Empty Initial Maintenance Tickets
export const INITIAL_TICKETS: MaintenanceTicket[] = [];

// Generate clean, empty initial building matrix (7 Buildings, 20 Apartments each)
export function generateInitialBuildings(): Building[] {
  const buildings: Building[] = [];

  const buildingNames = [
    'بناية الياقوت (Building 1)',
    'بناية الزمرد (Building 2)',
    'بناية الماس (Building 3)',
    'بناية اللؤلؤ (Building 4)',
    'بناية الفيروز (Building 5)',
    'بناية العقيق (قيد الإنشاء - Building 6)',
    'بناية الكهرومان (قيد الإنشاء - Building 7)',
  ];

  for (let b = 1; b <= 7; b++) {
    const isUnderConstruction = b > 5;
    const building: Building = {
      id: `building-${b}`,
      buildingNumber: b,
      name: buildingNames[b - 1],
      status: isUnderConstruction ? 'UNDER_CONSTRUCTION' : 'COMPLETED',
      totalFloors: 5,
      apartmentsPerFloor: 4,
      totalApartments: 20,
      apartments: [],
    };

    if (!isUnderConstruction) {
      let aptCounter = 1;
      for (let floor = 1; floor <= 5; floor++) {
        for (let aptNo = 1; aptNo <= 4; aptNo++) {
          const aptCode = `B0${b}-F0${floor}-A${aptCounter < 10 ? '0' + aptCounter : aptCounter}`;
          
          building.apartments.push({
            id: `apt-b${b}-a${aptCounter}`,
            buildingId: building.id,
            buildingNumber: b,
            floorNumber: floor,
            apartmentNumber: aptNo,
            sequentialCode: aptCode,
            isSold: false,
            price: 120000,
            paymentType: undefined,
            occupancyStatus: 'VACANT_UNSOLD',
            isOccupied: false,
            contractOwner: undefined,
            vehicles: [],
            garageSpots: [],
            subscriptions: [],
            installments: [],
          });

          aptCounter++;
        }
      }
    }

    buildings.push(building);
  }

  return buildings;
}
