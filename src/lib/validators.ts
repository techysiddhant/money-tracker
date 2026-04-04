import { z } from "zod/v4";

export const PAYMENT_METHOD_TYPES = [
  "card",
  "upi",
  "cash",
  "netbanking",
  "wallet",
  "other",
] as const;

export const CYCLE_STATUSES = ["active", "closed"] as const;

// ─── Payment Method ──────────────────────────────────────────────────────────

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(PAYMENT_METHOD_TYPES),
});

export const updatePaymentMethodSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  type: z.enum(PAYMENT_METHOD_TYPES).optional(),
});

// ─── Member ──────────────────────────────────────────────────────────────────

export const createMemberSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

// ─── Category ────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  icon: z.string().max(10).optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  icon: z.string().max(10).optional().nullable(),
});

// ─── Cycle ───────────────────────────────────────────────────────────────────

export const createCycleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export const updateCycleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(CYCLE_STATUSES).optional(),
});

// ─── Expense Split ───────────────────────────────────────────────────────────

export const expenseSplitSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  amount: z.number().min(0, "Amount must be positive"),
  received: z.number().min(0).default(0),
});

// ─── Expense ─────────────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  cycleId: z.string().min(1, "Cycle is required"),
  categoryId: z.string().min(1, "Category is required"),
  paymentMethodId: z.string().min(1, "Payment method is required"),
  comment: z.string().max(500).optional().nullable(),
  splits: z.array(expenseSplitSchema).optional().default([]),
});

export const updateExpenseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  date: z.string().min(1).optional(),
  cycleId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  paymentMethodId: z.string().min(1).optional(),
  comment: z.string().max(500).optional().nullable(),
  splits: z.array(expenseSplitSchema).optional(),
});

// ─── Type Exports ────────────────────────────────────────────────────────────

export type CreatePaymentMethod = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethod = z.infer<typeof updatePaymentMethodSchema>;
export type CreateMember = z.infer<typeof createMemberSchema>;
export type UpdateMember = z.infer<typeof updateMemberSchema>;
export type CreateCategory = z.infer<typeof createCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type CreateCycle = z.infer<typeof createCycleSchema>;
export type UpdateCycle = z.infer<typeof updateCycleSchema>;
export type CreateExpense = z.infer<typeof createExpenseSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;
export type ExpenseSplitInput = z.infer<typeof expenseSplitSchema>;
