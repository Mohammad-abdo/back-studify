/**
 * Zod Validation Schemas
 */

const { z } = require('zod');

/**
 * Common validation schemas
 */
const phoneSchema = z.string().min(10).max(15).regex(/^\+?[1-9]\d{1,14}$/);

const emailSchema = z.string().email();

const passwordSchema = z.string().min(8).max(100);

const uuidSchema = z.string().uuid();

const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});

/**
 * Auth validation schemas
 */
const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1),
});

const registerSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  repeatPassword: z.string().optional(),
  type: z.enum(['STUDENT', 'DOCTOR', 'DELIVERY', 'CUSTOMER']),
  email: emailSchema.optional(),
  name: z.string().min(2).max(100).optional(),
  nameAr: z.string().min(2).max(100).optional(), // Arabic name
  nameEn: z.string().min(2).max(100).optional(), // English name
  collegeId: uuidSchema.optional().nullable(),
  departmentId: uuidSchema.optional().nullable(),
}).refine((data) => !data.repeatPassword || data.password === data.repeatPassword, {
  message: "Passwords don't match",
  path: ['repeatPassword'],
}).refine((data) => {
  // collegeId and departmentId are only allowed for STUDENT and DOCTOR types
  if ((data.collegeId !== undefined && data.collegeId !== null) || 
      (data.departmentId !== undefined && data.departmentId !== null)) {
    return data.type === 'STUDENT' || data.type === 'DOCTOR';
  }
  return true;
}, {
  message: "collegeId and departmentId are only allowed for STUDENT and DOCTOR types",
  path: ['collegeId'],
});

const verifyOTPSchema = z.object({
  userId: uuidSchema,
  code: z.string().length(6).regex(/^\d+$/),
});

const resendOTPSchema = z.object({
  userId: uuidSchema,
});

const forgotPasswordSchema = z.object({
  phone: phoneSchema,
});

const resetPasswordSchema = z.object({
  userId: uuidSchema,
  code: z.string().length(6).regex(/^\d+$/),
  newPassword: passwordSchema,
  repeatPassword: z.string().optional(),
}).refine((data) => !data.repeatPassword || data.newPassword === data.repeatPassword, {
  message: "Passwords don't match",
  path: ['repeatPassword'],
});

/**
 * User validation schemas
 */
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: emailSchema.optional(),
  avatarUrl: z.string().url().optional(),
});

const updateStudentSchema = z.object({
  name: z.string().min(2).max(100),
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
});

const updateDoctorSchema = z.object({
  name: z.string().min(2).max(100),
  specialization: z.string().min(2).max(200),
});

/**
 * Book validation schemas
 */
const createBookSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10),
  fileUrl: z.string().url(),
  totalPages: z.number().int().positive(),
  categoryId: uuidSchema,
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
});

const updateBookSchema = createBookSchema.partial();

const createBookPricingSchema = z.object({
  bookId: uuidSchema,
  accessType: z.enum(['READ', 'BUY', 'PRINT']),
  price: z.number().nonnegative(),
});

/**
 * Product validation schemas
 */
const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10),
  categoryId: uuidSchema,
});

const updateProductSchema = createProductSchema.partial();

const createProductPricingSchema = z.object({
  productId: uuidSchema,
  minQuantity: z.number().int().positive(),
  price: z.number().nonnegative(),
});

/**
 * Order validation schemas
 */
const createOrderSchema = z.object({
  items: z.array(z.object({
    referenceType: z.enum(['BOOK', 'PRODUCT', 'PRINT_OPTION', 'MATERIAL']),
    referenceId: uuidSchema,
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
  })).min(1),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

/**
 * Review validation schemas
 */
const createReviewSchema = z.object({
  targetId: uuidSchema,
  targetType: z.enum(['BOOK', 'PRODUCT']),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

module.exports = {
  // Common
  phoneSchema,
  emailSchema,
  passwordSchema,
  uuidSchema,
  paginationSchema,

  // Auth
  loginSchema,
  registerSchema,
  verifyOTPSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,

  // User
  updateProfileSchema,
  updateStudentSchema,
  updateDoctorSchema,

  // Book
  createBookSchema,
  updateBookSchema,
  createBookPricingSchema,

  // Product
  createProductSchema,
  updateProductSchema,
  createProductPricingSchema,

  // Order
  createOrderSchema,
  updateOrderStatusSchema,

  // Review
  createReviewSchema,
};

