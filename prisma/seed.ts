import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/server/password';

const prisma = new PrismaClient();

const BUILDING_NAMES = [
  'بناية الياقوت (Building 1)',
  'بناية الزمرد (Building 2)',
  'بناية الماس (Building 3)',
  'بناية اللؤلؤ (Building 4)',
  'بناية الفيروز (Building 5)',
  'بناية العقيق (قيد الإنشاء - Building 6)',
  'بناية الكهرومان (قيد الإنشاء - Building 7)',
];

const SERVICES = [
  { code: 'SECURITY', name: 'الحراسة والأمن (Security)', monthlyPrice: 50, isDefault: true },
  { code: 'SANITATION', name: 'النظافة العامة وتجميع النفايات (Sanitation)', monthlyPrice: 40, isDefault: true },
  { code: 'ELEVATOR', name: 'صيانة المصاعد الكهروميكانيكية (Elevator Maint.)', monthlyPrice: 60, isDefault: true },
  { code: 'POOL', name: 'خدمات المسبح والحدائق (Pool & Gardens)', monthlyPrice: 35, isDefault: false },
  { code: 'FIBER', name: 'إنترنت الألياف الضوئية المشترك (Fiber Wifi)', monthlyPrice: 25, isDefault: false },
];

const pad = (n: number) => String(n).padStart(2, '0');

async function main() {
  for (let b = 1; b <= 7; b++) {
    const underConstruction = b > 5;
    const building = await prisma.building.upsert({
      where: { buildingNumber: b },
      create: {
        buildingNumber: b,
        name: BUILDING_NAMES[b - 1],
        status: underConstruction ? 'UNDER_CONSTRUCTION' : 'COMPLETED',
      },
      update: {},
    });
    if (underConstruction) continue;

    let counter = 1;
    for (let floor = 1; floor <= 5; floor++) {
      for (let apt = 1; apt <= 4; apt++, counter++) {
        const code = `B${pad(b)}-F${pad(floor)}-A${pad(counter)}`;
        await prisma.apartment.upsert({
          where: { sequentialCode: code },
          create: { buildingId: building.id, floorNumber: floor, apartmentNumber: apt, sequentialCode: code, price: 120000 },
          update: {},
        });
      }
    }
  }

  for (const s of SERVICES) {
    await prisma.service.upsert({ where: { code: s.code }, create: s, update: {} });
  }

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 10) {
    throw new Error('SEED_ADMIN_EMAIL و SEED_ADMIN_PASSWORD (10 أحرف على الأقل) مطلوبة لإنشاء حساب الأدمن');
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: { email, fullName: 'مالك المجمع', role: 'SUPER_ADMIN', passwordHash: await hashPassword(password) },
    });
    console.log(`Created SUPER_ADMIN ${email}`);
  }
  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
