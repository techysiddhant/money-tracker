import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { memberPayment } from "@/lib/schema";
import { getAuthenticatedUser, apiError, apiResponse } from "@/lib/api-utils";
import { createMemberPaymentSchema, CreateMemberPayment } from "@/lib/validators";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  try {
    const body = await request.json();
    const validatedData = createMemberPaymentSchema.parse(body);

    const db = getDb();
    
    const paymentId = nanoid();
    await db.insert(memberPayment).values({
      id: paymentId,
      userId: user.id,
      cycleId: validatedData.cycleId,
      memberId: validatedData.memberId,
      amount: validatedData.amount,
      note: validatedData.note,
      createdAt: new Date(),
    });

    return apiResponse({ id: paymentId, message: "Payment recorded successfully" }, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return apiError("Validation error", 400);
    }
    return apiError("Failed to record payment", 500);
  }
}
