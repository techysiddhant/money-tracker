import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { member } from "@/lib/schema";
import { createMemberSchema } from "@/lib/validators";
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
      .from(member)
      .where(eq(member.userId, user.id))
      .orderBy(desc(member.createdAt));
    return apiResponse({ data: results });
  }

  const { page, limit, offset } = getPaginationParams(url);

  const [results, [{ total }]] = await Promise.all([
    db
      .select()
      .from(member)
      .where(eq(member.userId, user.id))
      .orderBy(desc(member.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(member)
      .where(eq(member.userId, user.id)),
  ]);

  return paginatedResponse(results, total, page, limit);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createMemberSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const db = getDb();
  const now = new Date();
  const id = nanoid();

  await db.insert(member).values({
    id,
    userId: user.id,
    name: parsed.data.name,
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await db.select().from(member).where(eq(member.id, id));

  return apiResponse(created, 201);
}
