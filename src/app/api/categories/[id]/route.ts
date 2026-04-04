import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { category, expense } from "@/lib/schema";
import { updateCategorySchema } from "@/lib/validators";
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
    .from(category)
    .where(and(eq(category.id, id), eq(category.userId, user.id)));

  if (!result) return apiError("Category not found", 404);

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
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const db = getDb();

  const [existing] = await db
    .select()
    .from(category)
    .where(and(eq(category.id, id), eq(category.userId, user.id)));

  if (!existing) return apiError("Category not found", 404);

  await db
    .update(category)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(category.id, id));

  const [updated] = await db
    .select()
    .from(category)
    .where(eq(category.id, id));

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
    .from(category)
    .where(and(eq(category.id, id), eq(category.userId, user.id)));

  if (!existing) return apiError("Category not found", 404);

  const [{ total }] = await db
    .select({ total: count() })
    .from(expense)
    .where(eq(expense.categoryId, id));

  if (total > 0) {
    return apiError("Cannot delete category with associated expenses", 409);
  }

  await db.delete(category).where(eq(category.id, id));

  return apiResponse({ success: true });
}
