import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().min(1).max(max);

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const phoneSchema = z.string().trim().regex(/^\+?[0-9 ]{6,20}$/, 'رقم هاتف غير صالح');
export const genderSchema = z.enum(['ذكر', 'أنثى']);
export const passwordSchema = z.string().min(10, 'كلمة المرور يجب أن تكون 10 أحرف على الأقل').max(200);
export const periodSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'الفترة يجب أن تكون بصيغة YYYY-MM');
export const idSchema = z.string().uuid();

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(200) });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: passwordSchema,
});

export const occupancySchema = z.enum(['VACANT_UNSOLD', 'VACANT_SOLD', 'OWNER_OCCUPIED', 'RENTED']);

export const saleSchema = z
  .object({
    apartmentId: idSchema,
    buyer: z.object({
      fullName: trimmed(100),
      email: emailSchema,
      phone: phoneSchema,
      gender: genderSchema,
      familyMembersCount: z.number().int().min(1).max(30).default(1),
    }),
    paymentType: z.enum(['FULL_CASH', 'INSTALLMENTS']),
    occupancyStatus: z.enum(['OWNER_OCCUPIED', 'RENTED', 'VACANT_SOLD']),
    price: z.number().positive().max(100_000_000).optional(),
    downPayment: z.number().min(0).max(100_000_000).optional(),
    installmentMonths: z.number().int().min(1).max(360).optional(),
    firstDueDate: z.string().date().optional(),
  })
  .refine((v) => v.paymentType === 'FULL_CASH' || v.installmentMonths !== undefined, {
    message: 'عدد أشهر التقسيط مطلوب',
    path: ['installmentMonths'],
  });

export const vehicleSchema = z.object({
  plateNumber: trimmed(30),
  makeModel: trimmed(80),
  color: z.string().trim().max(30).optional(),
});

export const garageSchema = z.object({
  spotNumber: z.string().trim().regex(/^[A-Za-z0-9-]{2,20}$/, 'رقم موقف غير صالح'),
  zoneFloor: trimmed(60),
});

export const staffSchema = z.object({
  fullName: trimmed(100),
  email: emailSchema,
  phone: phoneSchema,
  gender: genderSchema,
  kind: z.enum(['STAFF', 'WORKER']),
  department: trimmed(80),
});

export const serviceUpdateSchema = z.object({
  isAvailable: z.boolean().optional(),
  monthlyPrice: z.number().min(0).max(1_000_000).optional(),
});

export const ticketSchema = z.object({
  apartmentId: idSchema.optional(),
  title: trimmed(120),
  description: trimmed(2000),
});

export const ticketStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
});
