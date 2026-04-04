import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { cycle } from "@/lib/schema";
import { updateCycleSchema } from "@/lib/validators";
import {
  getAuthenticatedUser,
  apiError,
  apiResponse,
} from "@/lib/api-utils";
import { eq, and } from "drizzle-orm";

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
    .from(cycle)
    .where(and(eq(cycle.id, id), eq(cycle.userId, user.id)));

  if (!result) return apiError("Cycle not found", 404);

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
  const parsed = updateCycleSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const db = getDb();

  const [existing] = await db
    .select()
    .from(cycle)
    .where(and(eq(cycle.id, id), eq(cycle.userId, user.id)));

  if (!existing) return apiError("Cycle not found", 404);

  // Don't allow reopening a closed cycle
  if (existing.status === "closed" && parsed.data.status === "active") {
    return apiError("Cannot reopen a closed cycle", 400);
  }

  await db
    .update(cycle)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(cycle.id, id));

  const [updated] = await db.select().from(cycle).where(eq(cycle.id, id));

  return apiResponse(updated);
}
