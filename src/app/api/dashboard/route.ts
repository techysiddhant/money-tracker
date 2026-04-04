import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import {
  expense,
  expenseSplit,
  category,
  member,
  paymentMethod,
  cycle,
} from "@/lib/schema";
import {
  getAuthenticatedUser,
  apiError,
  apiResponse,
} from "@/lib/api-utils";
import { eq, and, sum, count, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const url = new URL(request.url);
  const cycleId = url.searchParams.get("cycleId");
  const db = getDb();

  const conditions = [eq(expense.userId, user.id)];
  if (cycleId) conditions.push(eq(expense.cycleId, cycleId));
  const whereClause = and(...conditions);

  // Total expenses amount
  const [totalResult] = await db
    .select({ total: sum(expense.amount) })
    .from(expense)
    .where(whereClause);

  // Transaction count
  const [countResult] = await db
    .select({ total: count() })
    .from(expense)
    .where(whereClause);

  // Total received amount (across all splits for the user's expenses)
  const expenseIds = await db
    .select({ id: expense.id })
    .from(expense)
    .where(whereClause);

  let totalReceived = 0;
  let totalSplitAmount = 0;

  if (expenseIds.length > 0) {
    for (const { id } of expenseIds) {
      const [splitTotals] = await db
        .select({
          totalAmount: sum(expenseSplit.amount),
          totalReceived: sum(expenseSplit.received),
        })
        .from(expenseSplit)
        .where(eq(expenseSplit.expenseId, id));

      totalSplitAmount += Number(splitTotals?.totalAmount || 0);
      totalReceived += Number(splitTotals?.totalReceived || 0);
    }
  }

  // Spending by category
  const categorySpending = await db
    .select({
      categoryId: expense.categoryId,
      categoryName: category.name,
      categoryIcon: category.icon,
      total: sum(expense.amount),
      count: count(),
    })
    .from(expense)
    .leftJoin(category, eq(expense.categoryId, category.id))
    .where(whereClause)
    .groupBy(expense.categoryId, category.name, category.icon);

  // Spending by member (from splits)
  let memberSpending: Array<{
    memberId: string;
    memberName: string | null;
    totalAmount: number;
    totalReceived: number;
  }> = [];

  if (expenseIds.length > 0) {
    const allSplits = [];
    for (const { id } of expenseIds) {
      const splits = await db
        .select({
          memberId: expenseSplit.memberId,
          memberName: member.name,
          amount: expenseSplit.amount,
          received: expenseSplit.received,
        })
        .from(expenseSplit)
        .leftJoin(member, eq(expenseSplit.memberId, member.id))
        .where(eq(expenseSplit.expenseId, id));
      allSplits.push(...splits);
    }

    // Aggregate by member
    const memberMap = new Map<
      string,
      { memberName: string | null; totalAmount: number; totalReceived: number }
    >();
    for (const s of allSplits) {
      const existing = memberMap.get(s.memberId) || {
        memberName: s.memberName,
        totalAmount: 0,
        totalReceived: 0,
      };
      existing.totalAmount += s.amount;
      existing.totalReceived += s.received;
      memberMap.set(s.memberId, existing);
    }

    memberSpending = Array.from(memberMap.entries()).map(([memberId, data]) => ({
      memberId,
      ...data,
    }));
  }

  // Spending by payment method
  const paymentMethodSpending = await db
    .select({
      paymentMethodId: expense.paymentMethodId,
      paymentMethodName: paymentMethod.name,
      paymentMethodType: paymentMethod.type,
      total: sum(expense.amount),
      count: count(),
    })
    .from(expense)
    .leftJoin(paymentMethod, eq(expense.paymentMethodId, paymentMethod.id))
    .where(whereClause)
    .groupBy(
      expense.paymentMethodId,
      paymentMethod.name,
      paymentMethod.type
    );

  // Recent expenses (last 5)
  const recentExpenses = await db
    .select({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      categoryName: category.name,
      categoryIcon: category.icon,
      paymentMethodName: paymentMethod.name,
    })
    .from(expense)
    .leftJoin(category, eq(expense.categoryId, category.id))
    .leftJoin(paymentMethod, eq(expense.paymentMethodId, paymentMethod.id))
    .where(whereClause)
    .orderBy(desc(expense.date), desc(expense.createdAt))
    .limit(5);

  return apiResponse({
    totalExpenses: Number(totalResult?.total || 0),
    transactionCount: countResult?.total || 0,
    totalSplitAmount,
    totalReceived,
    pendingAmount: totalSplitAmount - totalReceived,
    categorySpending: categorySpending.map((c) => ({
      ...c,
      total: Number(c.total || 0),
    })),
    memberSpending,
    paymentMethodSpending: paymentMethodSpending.map((p) => ({
      ...p,
      total: Number(p.total || 0),
    })),
    recentExpenses,
  });
}
