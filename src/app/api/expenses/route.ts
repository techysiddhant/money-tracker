import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import {
  expense,
  expenseSplit,
  cycle,
  category,
  paymentMethod,
} from "@/lib/schema";
import { createExpenseSchema } from "@/lib/validators";
import {
  getAuthenticatedUser,
  apiError,
  getPaginationParams,
  paginatedResponse,
  apiResponse,
} from "@/lib/api-utils";
import { eq, and, count, desc, gte, lte, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const url = new URL(request.url);
  const { page, limit, offset } = getPaginationParams(url);
  const cycleId = url.searchParams.get("cycleId");
  const categoryId = url.searchParams.get("categoryId");
  const paymentMethodId = url.searchParams.get("paymentMethodId");
  const memberId = url.searchParams.get("memberId");
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");

  const db = getDb();

  // If filtering by memberId, find matching expense IDs first
  let memberExpenseIds: string[] | null = null;
  if (memberId) {
    const memberSplits = await db
      .select({ expenseId: expenseSplit.expenseId })
      .from(expenseSplit)
      .where(eq(expenseSplit.memberId, memberId));
    memberExpenseIds = memberSplits.map((s) => s.expenseId);
    if (memberExpenseIds.length === 0) {
      return paginatedResponse([], 0, page, limit);
    }
  }

  const conditions = [eq(expense.userId, user.id)];
  if (cycleId) conditions.push(eq(expense.cycleId, cycleId));
  if (categoryId) conditions.push(eq(expense.categoryId, categoryId));
  if (paymentMethodId)
    conditions.push(eq(expense.paymentMethodId, paymentMethodId));
  if (dateFrom) conditions.push(gte(expense.date, dateFrom));
  if (dateTo) conditions.push(lte(expense.date, dateTo));
  if (memberExpenseIds) conditions.push(inArray(expense.id, memberExpenseIds));

  const whereClause = and(...conditions);

  const [results, [{ total }]] = await Promise.all([
    db
      .select({
        id: expense.id,
        title: expense.title,
        amount: expense.amount,
        date: expense.date,
        comment: expense.comment,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
        cycleName: cycle.name,
        cycleId: expense.cycleId,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryId: expense.categoryId,
        paymentMethodName: paymentMethod.name,
        paymentMethodType: paymentMethod.type,
        paymentMethodId: expense.paymentMethodId,
      })
      .from(expense)
      .leftJoin(cycle, eq(expense.cycleId, cycle.id))
      .leftJoin(category, eq(expense.categoryId, category.id))
      .leftJoin(paymentMethod, eq(expense.paymentMethodId, paymentMethod.id))
      .where(whereClause)
      .orderBy(desc(expense.date), desc(expense.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(expense).where(whereClause),
  ]);

  // Fetch split counts for each expense
  const expenseIds = results.map((r) => r.id);
  let splitCounts: Record<string, number> = {};

  if (expenseIds.length > 0) {
    for (const eid of expenseIds) {
      const [{ total: splitCount }] = await db
        .select({ total: count() })
        .from(expenseSplit)
        .where(eq(expenseSplit.expenseId, eid));
      splitCounts[eid] = splitCount;
    }
  }

  const data = results.map((r) => ({
    ...r,
    splitCount: splitCounts[r.id] || 0,
  }));

  return paginatedResponse(data, total, page, limit);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0].message, 422);
  }

  const db = getDb();
  const now = new Date();
  const expenseId = nanoid();

  // Create the expense
  await db.insert(expense).values({
    id: expenseId,
    userId: user.id,
    title: parsed.data.title,
    amount: parsed.data.amount,
    date: parsed.data.date,
    cycleId: parsed.data.cycleId,
    categoryId: parsed.data.categoryId,
    paymentMethodId: parsed.data.paymentMethodId,
    comment: parsed.data.comment || null,
    createdAt: now,
    updatedAt: now,
  });

  // Create splits if any
  if (parsed.data.splits && parsed.data.splits.length > 0) {
    for (const split of parsed.data.splits) {
      await db.insert(expenseSplit).values({
        id: nanoid(),
        expenseId,
        memberId: split.memberId,
        amount: split.amount,
        received: split.received,
        createdAt: now,
      });
    }
  }

  const [created] = await db
    .select()
    .from(expense)
    .where(eq(expense.id, expenseId));

  const splits = await db
    .select()
    .from(expenseSplit)
    .where(eq(expenseSplit.expenseId, expenseId));

  return apiResponse({ ...created, splits }, 201);
}
