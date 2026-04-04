import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { paymentMethod, expense } from "@/lib/schema";
import { updatePaymentMethodSchema } from "@/lib/validators";
import {
  getAuthenticatedUser,
  apiError,
  apiResponse,
} from "@/lib/api-utils";
import { eq, and, count } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const db = getDb();

  const [result] = await db
    .select()
    .from(paymentMethod)
    .where(and(eq(paymentMethod.id, id), eq(paymentMethod.userId, user.id)));

  if (!result) return apiError("Payment method not found", 404);

  return apiResponse(result);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = updatePaymentMethodSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const db = getDb();

  const [existing] = await db
    .select()
    .from(paymentMethod)
    .where(and(eq(paymentMethod.id, id), eq(paymentMethod.userId, user.id)));

  if (!existing) return apiError("Payment method not found", 404);

  await db
    .update(paymentMethod)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(paymentMethod.id, id));

  const [updated] = await db
    .select()
    .from(paymentMethod)
    .where(eq(paymentMethod.id, id));

  return apiResponse(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const db = getDb();

  const [existing] = await db
    .select()
    .from(paymentMethod)
    .where(and(eq(paymentMethod.id, id), eq(paymentMethod.userId, user.id)));

  if (!existing) return apiError("Payment method not found", 404);

  // Check if any expenses reference this payment method
  const [{ total }] = await db
    .select({ total: count() })
    .from(expense)
    .where(eq(expense.paymentMethodId, id));

  if (total > 0) {
    return apiError(
      "Cannot delete payment method with associated expenses",
      409
    );
  }

  await db.delete(paymentMethod).where(eq(paymentMethod.id, id));

  return apiResponse({ success: true });
}
