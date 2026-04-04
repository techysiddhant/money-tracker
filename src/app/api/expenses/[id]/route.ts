import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import {
  expense,
  expenseSplit,
  member,
  cycle,
  category,
  paymentMethod,
} from "@/lib/schema";
import { updateExpenseSchema } from "@/lib/validators";
import {
  getAuthenticatedUser,
  apiError,
  apiResponse,
} from "@/lib/api-utils";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const db = getDb();

  const [result] = await db
    .select({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      comment: expense.comment,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      cycleId: expense.cycleId,
      cycleName: cycle.name,
      categoryId: expense.categoryId,
      categoryName: category.name,
      categoryIcon: category.icon,
      paymentMethodId: expense.paymentMethodId,
      paymentMethodName: paymentMethod.name,
      paymentMethodType: paymentMethod.type,
    })
    .from(expense)
    .leftJoin(cycle, eq(expense.cycleId, cycle.id))
    .leftJoin(category, eq(expense.categoryId, category.id))
    .leftJoin(paymentMethod, eq(expense.paymentMethodId, paymentMethod.id))
    .where(and(eq(expense.id, id), eq(expense.userId, user.id)));

  if (!result) return apiError("Expense not found", 404);

  // Get splits with member names
  const splits = await db
    .select({
      id: expenseSplit.id,
      memberId: expenseSplit.memberId,
      memberName: member.name,
      amount: expenseSplit.amount,
      received: expenseSplit.received,
      createdAt: expenseSplit.createdAt,
    })
    .from(expenseSplit)
    .leftJoin(member, eq(expenseSplit.memberId, member.id))
    .where(eq(expenseSplit.expenseId, id));

  return apiResponse({ ...result, splits });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const db = getDb();

  const [existing] = await db
    .select()
    .from(expense)
    .where(and(eq(expense.id, id), eq(expense.userId, user.id)));

  if (!existing) return apiError("Expense not found", 404);

  // Update expense fields
  const { splits, ...expenseData } = parsed.data;
  await db
    .update(expense)
    .set({ ...expenseData, updatedAt: new Date() })
    .where(eq(expense.id, id));

  // If splits are provided, replace all existing splits
  if (splits !== undefined) {
    await db.delete(expenseSplit).where(eq(expenseSplit.expenseId, id));

    const now = new Date();
    for (const split of splits) {
      await db.insert(expenseSplit).values({
        id: nanoid(),
        expenseId: id,
        memberId: split.memberId,
        amount: split.amount,
        received: split.received,
        createdAt: now,
      });
    }
  }

  const [updated] = await db
    .select()
    .from(expense)
    .where(eq(expense.id, id));

  const updatedSplits = await db
    .select({
      id: expenseSplit.id,
      memberId: expenseSplit.memberId,
      memberName: member.name,
      amount: expenseSplit.amount,
      received: expenseSplit.received,
      createdAt: expenseSplit.createdAt,
    })
    .from(expenseSplit)
    .leftJoin(member, eq(expenseSplit.memberId, member.id))
    .where(eq(expenseSplit.expenseId, id));

  return apiResponse({ ...updated, splits: updatedSplits });
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
    .from(expense)
    .where(and(eq(expense.id, id), eq(expense.userId, user.id)));

  if (!existing) return apiError("Expense not found", 404);

  // Splits are cascade deleted via foreign key
  await db.delete(expenseSplit).where(eq(expenseSplit.expenseId, id));
  await db.delete(expense).where(eq(expense.id, id));

  return apiResponse({ success: true });
}
