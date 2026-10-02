/**
 * End-to-end test: 100 residents (services + installments) through the real HTTP API,
 * then verifies every figure directly in PostgreSQL.
 *
 * Requires a freshly migrated + seeded database and a running server:
 *   npx prisma migrate reset --force && npm run build && npm start
 *   BASE_URL=http://localhost:3000 npm run test:load
 */
import { Prisma, PrismaClient } from '@prisma/client';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD!;
const prisma = new PrismaClient();

let failures = 0;
let passes = 0;
function check(cond: boolean, label: string, extra?: unknown) {
  if (cond) {
    passes++;
    console.log(`  ✔ ${label}`);
  } else {
    failures++;
    console.log(`  ✘ ${label}`, extra ?? '');
  }
}

class Client {
  cookie = '';
  constructor(private origin: string | null = BASE) {}

  async req(method: string, path: string, body?: unknown) {
    const headers: Record<string, string> = {};
    if (this.cookie) headers.cookie = this.cookie;
    if (this.origin) headers.origin = this.origin;
    if (body !== undefined) headers['content-type'] = 'application/json';
    const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
    const set = res.headers.get('set-cookie');
    if (set) this.cookie = set.split(';')[0];
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  async login(email: string, password: string) {
    const r = await this.req('POST', '/api/auth/login', { email, password });
    if (r.status !== 200) throw new Error(`login failed for ${email}: ${r.status} ${JSON.stringify(r.data)}`);
    return this;
  }
}

async function pool<T, R>(items: T[], size: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

type Plan = {
  paymentType: 'FULL_CASH' | 'INSTALLMENTS';
  occupancyStatus: 'OWNER_OCCUPIED' | 'RENTED' | 'VACANT_SOLD';
  downPayment?: number;
  installmentMonths?: number;
  firstDueDate?: string;
};

// Four resident profiles, 25 apartments each.
const PLANS: Plan[] = [
  { paymentType: 'FULL_CASH', occupancyStatus: 'OWNER_OCCUPIED' },
  { paymentType: 'INSTALLMENTS', occupancyStatus: 'OWNER_OCCUPIED', downPayment: 20000, installmentMonths: 24, firstDueDate: '2026-07-01' },
  { paymentType: 'INSTALLMENTS', occupancyStatus: 'RENTED', downPayment: 0, installmentMonths: 7 },
  { paymentType: 'INSTALLMENTS', occupancyStatus: 'VACANT_SOLD', downPayment: 30000.5, installmentMonths: 36 },
];

async function main() {
  const t0 = Date.now();
  const anon = new Client();

  console.log('\n1) أمان: الوصول بدون تسجيل دخول و CSRF وتسجيل الدخول الخاطئ');
  check((await anon.req('GET', '/api/buildings')).status === 401, 'GET /api/buildings بدون جلسة = 401');
  check((await anon.req('GET', '/api/me/apartment')).status === 401, 'GET /api/me/apartment بدون جلسة = 401');
  check((await new Client(null).req('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })).status === 403, 'POST بدون Origin مرفوض (CSRF) = 403');
  check((await new Client('https://evil.example').req('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })).status === 403, 'POST من موقع آخر مرفوض (CSRF) = 403');
  check((await anon.req('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: 'wrong-password' })).status === 401, 'كلمة مرور خاطئة = 401');
  check((await anon.req('POST', '/api/auth/login', { email: "' OR 1=1 --", password: 'x' })).status === 400, 'حقن SQL في البريد يُرفض بالتحقق = 400');
  const page = await fetch(BASE + '/admin', { redirect: 'manual' });
  check(page.status === 307 && (page.headers.get('location') ?? '').includes('/login'), 'صفحة /admin بدون جلسة تحوّل إلى /login');
  check(page.headers.get('x-frame-options') === 'DENY' && !!page.headers.get('content-security-policy'), 'ترويسات الأمان (CSP, X-Frame-Options) موجودة');
  const fakeSession = new Client();
  fakeSession.cookie = 'rc_session=forged-token-value';
  check((await fakeSession.req('GET', '/api/buildings')).status === 401, 'كوكي جلسة مزوّر = 401');

  const admin = await new Client().login(ADMIN_EMAIL, ADMIN_PASSWORD);

  console.log('\n2) الأدمن ينشئ موظف إداري وعامل صيانة');
  const staffRes = await admin.req('POST', '/api/staff', { fullName: 'موظف التحصيل', email: 'staff1@test.local', phone: '+964 770 111 2222', gender: 'ذكر', kind: 'STAFF', department: 'قسم الحسابات والاشتراكات' });
  const workerRes = await admin.req('POST', '/api/staff', { fullName: 'فني الصيانة', email: 'worker1@test.local', phone: '+964 770 333 4444', gender: 'ذكر', kind: 'WORKER', department: 'صيانة عامة وفريلانس' });
  check(staffRes.status === 200 && workerRes.status === 200, 'إنشاء موظف وعامل');
  const staff = await new Client().login('staff1@test.local', staffRes.data.credentials.temporaryPassword);
  const worker = await new Client().login('worker1@test.local', workerRes.data.credentials.temporaryPassword);
  check((await staff.req('POST', '/api/staff', { fullName: 'x', email: 'x@test.local', phone: '+9647701', gender: 'ذكر', kind: 'STAFF', department: 'x' })).status === 403, 'الموظف لا يستطيع إنشاء موظفين = 403');
  check((await staff.req('POST', '/api/sales', {})).status === 403, 'الموظف لا يستطيع تسجيل بيع = 403');

  console.log('\n3) تسجيل بيع 100 شقة لـ 100 ساكن عبر الـ API');
  const buildings = (await admin.req('GET', '/api/buildings')).data as { status: string; apartments: { id: string; sequentialCode: string; price: number }[] }[];
  const apartments = buildings.flatMap((b) => b.apartments);
  check(apartments.length === 100, `عدد الشقق المتاحة = 100 (فعلي ${apartments.length})`);
  check(buildings.filter((b) => b.status === 'UNDER_CONSTRUCTION').length === 2, 'بنايتان قيد الإنشاء');

  const residents = await pool(apartments, 10, async (apt, i) => {
    const plan = PLANS[i % 4];
    const r = await admin.req('POST', '/api/sales', {
      apartmentId: apt.id,
      buyer: { fullName: `ساكن رقم ${i + 1}`, email: `resident${i + 1}@test.local`, phone: `+964 770 ${String(1000000 + i)}`, gender: i % 2 ? 'أنثى' : 'ذكر', familyMembersCount: (i % 5) + 1 },
      ...plan,
    });
    if (r.status !== 200) throw new Error(`sale ${i} failed ${r.status} ${JSON.stringify(r.data)}`);
    return { apt, plan, password: r.data.credentials.temporaryPassword as string, email: `resident${i + 1}@test.local` };
  });
  check(residents.length === 100, 'تم تسجيل 100 عملية بيع');
  check((await admin.req('POST', '/api/sales', { apartmentId: apartments[0].id, buyer: { fullName: 'مكرر', email: 'dup@test.local', phone: '+9647700000', gender: 'ذكر', familyMembersCount: 1 }, paymentType: 'FULL_CASH', occupancyStatus: 'OWNER_OCCUPIED' })).status === 409, 'بيع شقة مباعة مسبقاً مرفوض = 409');
  check((await admin.req('POST', '/api/sales', { apartmentId: apartments[0].id, buyer: { fullName: 'x', email: 'bad', phone: '1', gender: 'ذكر' }, paymentType: 'INSTALLMENTS', occupancyStatus: 'OWNER_OCCUPIED' })).status === 400, 'بيانات بيع غير صالحة مرفوضة = 400');

  console.log('\n4) إصدار فواتير الاشتراكات الشهرية (الشقق المسكونة فقط)');
  const occupiedCount = residents.filter((r) => r.plan.occupancyStatus !== 'VACANT_SOLD').length;
  const g1 = await staff.req('POST', '/api/billing/charges', { period: '2026-10' });
  check(g1.status === 200 && g1.data.created === occupiedCount * 3, `فواتير أكتوبر = ${occupiedCount} شقة × 3 خدمات = ${occupiedCount * 3} (فعلي ${g1.data?.created})`);
  const g2 = await staff.req('POST', '/api/billing/charges', { period: '2026-10' });
  check(g2.data.created === 0, 'إعادة الإصدار لنفس الشهر لا تكرر الفواتير');
  check((await staff.req('POST', '/api/billing/charges', { period: '2026-13' })).status === 400, 'فترة غير صالحة مرفوضة');

  console.log('\n5) تسجيل دفع الأقساط وفواتير الاشتراكات من قبل الموظف');
  const details = await pool(residents, 10, async (r) => (await staff.req('GET', `/api/apartments/${r.apt.id}`)).data);
  let paidInstallments = 0;
  let paidCharges = 0;
  await pool(details, 10, async (d, i) => {
    if (d.installments.length > 0) {
      const r = await staff.req('POST', `/api/installments/${d.installments[0].id}/pay`);
      if (r.status === 200) paidInstallments++;
    }
    if (i % 2 === 0) {
      for (const c of d.unpaidCharges) {
        const r = await staff.req('POST', `/api/charges/${c.id}/pay`);
        if (r.status === 200) paidCharges++;
      }
    }
  });
  const instApts = details.filter((d) => d.installments.length > 0);
  check(paidInstallments === instApts.length, `دفع القسط الأول لـ ${instApts.length} شقة بالأقساط`);
  check((await staff.req('POST', `/api/installments/${instApts[0].installments[0].id}/pay`)).status === 409, 'دفع نفس القسط مرتين مرفوض = 409');

  const target = instApts[1].installments[1].id;
  const race = await Promise.all(Array.from({ length: 8 }, () => staff.req('POST', `/api/installments/${target}/pay`)));
  check(race.filter((r) => r.status === 200).length === 1, '8 طلبات دفع متزامنة لنفس القسط: واحد فقط نجح');
  paidInstallments++;

  console.log('\n6) تغيير حالة السكن وتأثيره على الاشتراكات');
  const vacant = residents.find((r) => r.plan.occupancyStatus === 'VACANT_SOLD')!;
  const owner = residents.find((r) => r.plan.occupancyStatus === 'OWNER_OCCUPIED')!;
  const o1 = await staff.req('POST', `/api/apartments/${vacant.apt.id}/occupancy`, { status: 'RENTED' });
  check(o1.status === 200 && o1.data.subscriptions.length === 3, 'شقة فارغة أصبحت مؤجرة → 3 اشتراكات فعّالة');
  const o2 = await staff.req('POST', `/api/apartments/${owner.apt.id}/occupancy`, { status: 'VACANT_SOLD' });
  check(o2.status === 200 && o2.data.subscriptions.length === 0, 'شقة مسكونة أُخليت → الاشتراكات متوقفة');
  check((await staff.req('POST', `/api/apartments/${owner.apt.id}/occupancy`, { status: 'VACANT_UNSOLD' })).status === 400, 'لا يمكن جعل شقة مباعة "غير مباعة"');
  const g3 = await staff.req('POST', '/api/billing/charges', { period: '2026-11' });
  check(g3.data.created === occupiedCount * 3, `فواتير نوفمبر = ${occupiedCount * 3} (+1 شقة، -1 شقة)`);

  console.log('\n7) دخول الـ 100 ساكن وعزل البيانات بينهم');
  const isolation = await pool(residents, 10, async (r, i) => {
    const c = await new Client().login(r.email, r.password);
    const mine = await c.req('GET', '/api/me/apartment');
    const other = residents[(i + 1) % residents.length].apt.id;
    const peek = await c.req('GET', `/api/apartments/${other}`);
    const all = await c.req('GET', '/api/buildings');
    const sale = await c.req('POST', '/api/sales', {});
    const pay = mine.data.installments[0] ? await c.req('POST', `/api/installments/${mine.data.installments[0].id}/pay`) : { status: 403 };
    const veh = await c.req('POST', `/api/apartments/${r.apt.id}/vehicles`, { plateNumber: `بغداد ${10000 + i}`, makeModel: 'Toyota Camry 2024', color: 'أبيض' });
    const vehOther = await c.req('POST', `/api/apartments/${other}/vehicles`, { plateNumber: `X-${i}`, makeModel: 'x' });
    const garage = await c.req('POST', `/api/apartments/${r.apt.id}/garage`, { spotNumber: `G1-P${i}`, zoneFloor: 'x' });
    const ticket = i < 10 ? await c.req('POST', '/api/tickets', { title: `تسريب مياه ${i}`, description: '<script>alert(1)</script> في المطبخ' }) : { status: 200 };
    return (
      mine.status === 200 && mine.data.id === r.apt.id &&
      peek.status === 403 && all.status === 403 && sale.status === 403 && pay.status === 403 &&
      veh.status === 200 && vehOther.status === 403 && garage.status === 403 && ticket.status === 200
    );
  });
  check(isolation.every(Boolean), `كل الساكنين (${isolation.filter(Boolean).length}/100) يرون شقتهم فقط ولا يستطيعون الوصول لغيرها أو للإدارة`);

  console.log('\n8) طلبات الصيانة: العامل يستلم وينجز');
  const tickets = (await worker.req('GET', '/api/tickets')).data as { id: string; description: string }[];
  check(tickets.length === 10, `العامل يرى 10 بلاغات (فعلي ${tickets.length})`);
  check((await worker.req('PATCH', `/api/tickets/${tickets[0].id}`, { status: 'RESOLVED' })).status === 400, 'لا يمكن إنجاز بلاغ قبل بدء التنفيذ');
  check((await worker.req('PATCH', `/api/tickets/${tickets[0].id}`, { status: 'IN_PROGRESS' })).status === 200, 'العامل يبدأ التنفيذ');
  check((await worker.req('PATCH', `/api/tickets/${tickets[0].id}`, { status: 'RESOLVED' })).status === 200, 'العامل ينجز البلاغ');
  check((await worker.req('GET', '/api/buildings')).status === 403, 'العامل لا يرى بيانات الشقق والسكان = 403');

  console.log('\n9) التحقق المباشر من قاعدة البيانات PostgreSQL');
  const [residentUsers, soldApts, inst, subs, charges, payments, vehicles, auditCount] = await Promise.all([
    prisma.user.count({ where: { role: 'RESIDENT' } }),
    prisma.apartment.count({ where: { isSold: true } }),
    prisma.installment.findMany({ include: { apartment: true } }),
    prisma.subscription.count({ where: { isActive: true } }),
    prisma.subscriptionCharge.findMany(),
    prisma.payment.findMany(),
    prisma.vehicle.count(),
    prisma.auditLog.count(),
  ]);
  check(residentUsers === 100, `100 مستخدم ساكن مخزن (فعلي ${residentUsers})`);
  check(soldApts === 100, `100 شقة مباعة مخزنة (فعلي ${soldApts})`);
  check(vehicles === 100, `100 سيارة مخزنة (فعلي ${vehicles})`);

  const expectedInstallmentRows = residents.reduce((t, r) => t + (r.plan.installmentMonths ?? 0), 0);
  check(inst.length === expectedInstallmentRows, `عدد الأقساط المخزنة = ${expectedInstallmentRows} (فعلي ${inst.length})`);

  // Per-apartment: installments + down payment must equal the price to the cent.
  const byApt = new Map<string, Prisma.Decimal>();
  for (const i of inst) byApt.set(i.apartmentId, (byApt.get(i.apartmentId) ?? new Prisma.Decimal(0)).add(i.amount));
  const scheduleOk = residents
    .filter((r) => r.plan.paymentType === 'INSTALLMENTS')
    .every((r) => byApt.get(r.apt.id)!.add(r.plan.downPayment ?? 0).equals(new Prisma.Decimal(r.apt.price)));
  check(scheduleOk, 'مجموع الأقساط + الدفعة المقدمة = سعر الشقة بالضبط (لكل الشقق، بدون فروقات كسور)');
  check(inst.filter((i) => i.isPaid).length === paidInstallments, `الأقساط المدفوعة في القاعدة = ${paidInstallments}`);

  check(subs === occupiedCount * 3, `الاشتراكات الفعالة = ${occupiedCount * 3} (فعلي ${subs})`);
  check(charges.length === occupiedCount * 3 * 2, `فواتير الاشتراك المخزنة لشهرين = ${occupiedCount * 6} (فعلي ${charges.length})`);
  check(charges.filter((c) => c.isPaid).length === paidCharges, `فواتير مدفوعة = ${paidCharges}`);

  const sum = (kind: string) => payments.filter((p) => p.kind === kind).reduce((t, p) => t.add(p.amount), new Prisma.Decimal(0));
  const cashExpected = residents.filter((r) => r.plan.paymentType === 'FULL_CASH').reduce((t, r) => t + r.apt.price, 0);
  const downExpected = residents.reduce((t, r) => t + (r.plan.downPayment ?? 0), 0);
  check(sum('FULL_CASH').equals(cashExpected), `مدفوعات الكاش = ${cashExpected}`);
  check(sum('DOWN_PAYMENT').equals(downExpected), `الدفعات المقدمة = ${downExpected}`);
  const paidChargesTotal = charges.filter((c) => c.isPaid).reduce((t, c) => t.add(c.amount), new Prisma.Decimal(0));
  check(sum('SUBSCRIPTION').equals(paidChargesTotal), `مدفوعات الاشتراكات = مجموع الفواتير المدفوعة (${paidChargesTotal})`);
  check(payments.filter((p) => p.kind === 'INSTALLMENT').length === paidInstallments, 'كل قسط مدفوع له سجل دفع واحد');

  const summary = (await admin.req('GET', '/api/finance/summary')).data;
  const dbCollected = payments.reduce((t, p) => t.add(p.amount), new Prisma.Decimal(0));
  check(new Prisma.Decimal(summary.totalCollected).equals(dbCollected), `ملخص الأدمن المالي يطابق القاعدة: محصّل ${dbCollected}`);
  check(summary.overdueInstallments.count > 0, `أقساط متأخرة مكتشفة: ${summary.overdueInstallments.count}`);
  check(auditCount > 300, `سجل التدقيق (Audit Log) يحتوي ${auditCount} عملية`);

  const xss = await prisma.maintenanceTicket.findFirst({ where: { description: { contains: '<script>' } } });
  check(!!xss, 'النص الخطر يُخزن كنص عادي (React يعرضه بدون تنفيذ)');

  console.log(`\nالنتيجة: ${passes} نجح، ${failures} فشل — المدة ${((Date.now() - t0) / 1000).toFixed(1)} ثانية`);
  await prisma.$disconnect();
  process.exit(failures ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
