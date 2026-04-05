import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { memberAdditionalCost } from "@/lib/schema";
import { getAuthenticatedUser, apiError, apiResponse } from "@/lib/api-utils";
import { createMemberAdditionalCostSchema } from "@/lib/validators";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  try {
    const body = await request.json();
    const validatedData = createMemberAdditionalCostSchema.parse(body);

    const db = getDb();
    
    const costId = nanoid();
    await db.insert(memberAdditionalCost).values({
      id: costId,
      userId: user.id,
      cycleId: validatedData.cycleId,
      memberId: validatedData.memberId,
      amount: validatedData.amount,
      description: validatedData.description,
      createdAt: new Date(),
    });

    return apiResponse({ id: costId, message: "Additional cost recorded successfully" }, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return apiError("Validation error", 400);
    }
    return apiError("Failed to record cost", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const url = new URL(request.url);
  const costId = url.searchParams.get("id");

  if (!costId) return apiError("Cost ID required", 400);

  try {
    const db = getDb();
    await db.delete(memberAdditionalCost).where(
      and(
        eq(memberAdditionalCost.id, costId),
        eq(memberAdditionalCost.userId, user.id)
      )
    );

    return apiResponse({ message: "Additional cost deleted successfully" });
  } catch (error) {
    return apiError("Failed to delete cost", 500);
  }
}
