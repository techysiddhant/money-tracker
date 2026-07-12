import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import {
  expense,
  expenseSplit,
  category,
  member,
  paymentMethod,
} from "@/lib/schema";
import {
  getAuthenticatedUser,
  apiError,
  apiResponse,
} from "@/lib/api-utils";
import {
  eq,
  and,
  sum,
  count,
  desc,
} from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const db = getDb();

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get("cycleId");

    const conditions = [eq(expense.userId, user.id)];

    if (cycleId) {
      conditions.push(eq(expense.cycleId, cycleId));
    }

    const whereClause = and(...conditions);

    const [
      totalResult,
      countResult,
      splitRows,
      categoryRows,
      paymentRows,
      timelineRows,
      recentExpenses,
    ] = await Promise.all([
      db
        .select({
          total: sum(expense.amount),
        })
        .from(expense)
        .where(whereClause),

      db
        .select({
          total: count(),
        })
        .from(expense)
        .where(whereClause),

      db
        .select({
          memberId: expenseSplit.memberId,
          memberName: member.name,
          amount: expenseSplit.amount,
          received: expenseSplit.received,
        })
        .from(expenseSplit)
        .innerJoin(
          expense,
          eq(expenseSplit.expenseId, expense.id)
        )
        .leftJoin(
          member,
          eq(expenseSplit.memberId, member.id)
        )
        .where(whereClause),

      db
        .select({
          categoryId: expense.categoryId,
          categoryName: category.name,
          categoryIcon: category.icon,
          total: sum(expense.amount),
          count: count(),
        })
        .from(expense)
        .leftJoin(
          category,
          eq(expense.categoryId, category.id)
        )
        .where(whereClause)
        .groupBy(
          expense.categoryId,
          category.name,
          category.icon
        ),

      db
        .select({
          paymentMethodId: expense.paymentMethodId,
          paymentMethodName: paymentMethod.name,
          paymentMethodType: paymentMethod.type,
          total: sum(expense.amount),
          count: count(),
        })
        .from(expense)
        .leftJoin(
          paymentMethod,
          eq(expense.paymentMethodId, paymentMethod.id)
        )
        .where(whereClause)
        .groupBy(
          expense.paymentMethodId,
          paymentMethod.name,
          paymentMethod.type
        ),

      db
        .select({
          date: expense.date,
          total: sum(expense.amount),
        })
        .from(expense)
        .where(whereClause)
        .groupBy(expense.date)
        .orderBy(expense.date),

      db
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
        .leftJoin(
          category,
          eq(expense.categoryId, category.id)
        )
        .leftJoin(
          paymentMethod,
          eq(expense.paymentMethodId, paymentMethod.id)
        )
        .where(whereClause)
        .orderBy(
          desc(expense.date),
          desc(expense.createdAt)
        )
        .limit(5),
    ]);

    let totalSplitAmount = 0;
    let totalReceived = 0;

    const memberMap = new Map<
      string,
      {
        memberName: string | null;
        totalAmount: number;
        totalReceived: number;
      }
    >();

    for (const row of splitRows) {
      const amount = Number(row.amount ?? 0);
      const received = Number(row.received ?? 0);

      totalSplitAmount += amount;
      totalReceived += received;

      if (!row.memberId) continue;

      const existing = memberMap.get(row.memberId) ?? {
        memberName: row.memberName,
        totalAmount: 0,
        totalReceived: 0,
      };

      existing.totalAmount += amount;
      existing.totalReceived += received;

      memberMap.set(row.memberId, existing);
    }

    const memberSpending = Array.from(memberMap.entries()).map(
      ([memberId, value]) => ({
        memberId,
        ...value,
      })
    );

    return apiResponse({
      totalExpenses: Number(totalResult[0]?.total ?? 0),
      transactionCount: Number(countResult[0]?.total ?? 0),

      totalSplitAmount,
      totalReceived,
      pendingAmount: totalSplitAmount - totalReceived,

      memberSpending,

      categorySpending: categoryRows.map((row) => ({
        ...row,
        total: Number(row.total ?? 0),
      })),

      paymentMethodSpending: paymentRows.map((row) => ({
        ...row,
        total: Number(row.total ?? 0),
      })),

      timelineSpending: timelineRows.map((row) => ({
        date: row.date,
        total: Number(row.total ?? 0),
      })),

      recentExpenses,
    });
  } catch (error) {
    console.error("Dashboard API Error");
    console.error(error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((error as any)?.cause);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((error as any)?.stack);

    return apiError("Failed to fetch dashboard data", 500);
  }
}