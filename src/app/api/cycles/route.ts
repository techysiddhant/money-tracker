import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { cycle } from "@/lib/schema";
import { createCycleSchema } from "@/lib/validators";
import {
  getAuthenticatedUser,
  apiError,
  getPaginationParams,
  paginatedResponse,
  apiResponse,
} from "@/lib/api-utils";
import { eq, count, desc } from "drizzle-orm";
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
      .from(cycle)
      .where(eq(cycle.userId, user.id))
      .orderBy(desc(cycle.createdAt));
    return apiResponse({ data: results });
  }

  const { page, limit, offset } = getPaginationParams(url);

  const [results, [{ total }]] = await Promise.all([
    db
      .select()
      .from(cycle)
      .where(eq(cycle.userId, user.id))
      .orderBy(desc(cycle.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(cycle)
      .where(eq(cycle.userId, user.id)),
  ]);

  return paginatedResponse(results, total, page, limit);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createCycleSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const db = getDb();
  const now = new Date();
  const id = nanoid();

  await db.insert(cycle).values({
    id,
    userId: user.id,
    name: parsed.data.name,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await db.select().from(cycle).where(eq(cycle.id, id));

  return apiResponse(created, 201);
}
