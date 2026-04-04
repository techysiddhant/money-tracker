import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { member, expenseSplit } from "@/lib/schema";
import { updateMemberSchema } from "@/lib/validators";
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
    .from(member)
    .where(and(eq(member.id, id), eq(member.userId, user.id)));

  if (!result) return apiError("Member not found", 404);

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
  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const db = getDb();

  const [existing] = await db
    .select()
    .from(member)
    .where(and(eq(member.id, id), eq(member.userId, user.id)));

  if (!existing) return apiError("Member not found", 404);

  await db
    .update(member)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(member.id, id));

  const [updated] = await db.select().from(member).where(eq(member.id, id));

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
    .from(member)
    .where(and(eq(member.id, id), eq(member.userId, user.id)));

  if (!existing) return apiError("Member not found", 404);

  // Check if any expense splits reference this member
  const [{ total }] = await db
    .select({ total: count() })
    .from(expenseSplit)
    .where(eq(expenseSplit.memberId, id));

  if (total > 0) {
    return apiError(
      "Cannot delete member with associated expense splits",
      409
    );
  }

  await db.delete(member).where(eq(member.id, id));

  return apiResponse({ success: true });
}
