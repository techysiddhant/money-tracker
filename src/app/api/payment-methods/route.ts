import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { paymentMethod } from "@/lib/schema";
import { createPaymentMethodSchema } from "@/lib/validators";
import {
  getAuthenticatedUser,
  apiError,
  getPaginationParams,
  paginatedResponse,
  apiResponse,
} from "@/lib/api-utils";
import { eq, and, count, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const url = new URL(request.url);
  const all = url.searchParams.get("all") === "true";
  const db = getDb();

  if (all) {
    const results = await db
      .select()
      .from(paymentMethod)
      .where(eq(paymentMethod.userId, user.id))
      .orderBy(desc(paymentMethod.createdAt));
    return apiResponse({ data: results });
  }

  const { page, limit, offset } = getPaginationParams(url);

  const [results, [{ total }]] = await Promise.all([
    db
      .select()
      .from(paymentMethod)
      .where(eq(paymentMethod.userId, user.id))
      .orderBy(desc(paymentMethod.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(paymentMethod)
      .where(eq(paymentMethod.userId, user.id)),
  ]);

  return paginatedResponse(results, total, page, limit);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createPaymentMethodSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const db = getDb();
  const now = new Date();
  const id = nanoid();

  await db.insert(paymentMethod).values({
    id,
    userId: user.id,
    name: parsed.data.name,
    type: parsed.data.type,
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await db
    .select()
    .from(paymentMethod)
    .where(eq(paymentMethod.id, id));

  return apiResponse(created, 201);
}
