import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import {
  cycle,
  expense,
  expenseSplit,
  member,
  memberAdditionalCost,
  memberPayment,
  paymentMethod,
} from "@/lib/schema";
import { getAuthenticatedUser, apiError, apiResponse } from "@/lib/api-utils";
import { eq, and, sql, desc, lt, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return apiError("Unauthorized", 401);

  const url = new URL(request.url);
  const cycleId = url.searchParams.get("cycleId");

  if (!cycleId) {
    return apiError("cycleId is required", 400);
  }

  const db = getDb();

  // 1. Get the requested cycle
  const currentCycle = await db
    .select()
    .from(cycle)
    .where(and(eq(cycle.id, cycleId), eq(cycle.userId, user.id)))
    .get();

  if (!currentCycle) {
    return apiError("Cycle not found", 404);
  }

  // Allow viewing active cycles as well, but maybe show a warning on UI
  // if (currentCycle.status !== "closed") {
  //   return apiError("Financials are only available for closed cycles", 400);
  // }

  // 2. Total cycle spend
  const [{ totalSpend }] = await db
    .select({
      totalSpend: sql<number>`sum(${expense.amount})`,
    })
    .from(expense)
    .where(and(eq(expense.cycleId, cycleId), eq(expense.userId, user.id)));

  // 3. Per-payment-method breakdown
  const paymentMethodsSpend = await db
    .select({
      paymentMethodId: paymentMethod.id,
      name: paymentMethod.name,
      amount: sql<number>`sum(${expense.amount})`,
    })
    .from(expense)
    .innerJoin(paymentMethod, eq(expense.paymentMethodId, paymentMethod.id))
    .where(and(eq(expense.cycleId, cycleId), eq(expense.userId, user.id)))
    .groupBy(paymentMethod.id);

  // 4. Per-member breakdown for THIS cycle
  const members = await db
    .select()
    .from(member)
    .where(eq(member.userId, user.id));

  // Get all splits for this cycle
  const cycleSplits = await db
    .select({
      memberId: expenseSplit.memberId,
      amount: sql<number>`sum(${expenseSplit.amount})`,
      // fallback to also checking expenseSplit.received for legacy data, but mostly we rely on memberPayment now
      received: sql<number>`sum(${expenseSplit.received})`,
    })
    .from(expenseSplit)
    .innerJoin(expense, eq(expenseSplit.expenseId, expense.id))
    .where(and(eq(expense.cycleId, cycleId), eq(expense.userId, user.id)))
    .groupBy(expenseSplit.memberId);

  // Get additional costs for this cycle
  const additionalCosts = await db
    .select({
      id: memberAdditionalCost.id,
      memberId: memberAdditionalCost.memberId,
      amount: memberAdditionalCost.amount,
      description: memberAdditionalCost.description,
    })
    .from(memberAdditionalCost)
    .where(and(eq(memberAdditionalCost.cycleId, cycleId), eq(memberAdditionalCost.userId, user.id)));

  // Get payments for this cycle
  const payments = await db
    .select({
      id: memberPayment.id,
      memberId: memberPayment.memberId,
      amount: memberPayment.amount,
      note: memberPayment.note,
      createdAt: memberPayment.createdAt,
    })
    .from(memberPayment)
    .where(and(eq(memberPayment.cycleId, cycleId), eq(memberPayment.userId, user.id)));

  // 5. Carry-forward logic (amount pending from all PRIOR closed cycles)
  // We'll calculate the net pending up to the start date of the current cycle.
  // Net pending = Sum(all prior splits + all prior additional costs - all prior payments - all prior split.received)
  
  const priorCycles = await db
    .select({ id: cycle.id })
    .from(cycle)
    .where(
      and(
        eq(cycle.userId, user.id),
        eq(cycle.status, "closed"),
        lt(cycle.startDate, currentCycle.startDate) // Older cycles
      )
    );

  const priorCycleIds = priorCycles.map(c => c.id);
  
  let priorSplits: { memberId: string; amount: number; received: number }[] = [];
  let priorAdditionalCosts: { memberId: string; amount: number }[] = [];
  let priorPayments: { memberId: string; amount: number }[] = [];

  if (priorCycleIds.length > 0) {
    const placeholders = priorCycleIds.map(() => "?").join(",");
    
    // Have to fallback to doing separate manual queries since inArray with empty array breaks some query engines
    priorSplits = await db
      .select({
        memberId: expenseSplit.memberId,
        amount: sql<number>`sum(${expenseSplit.amount})`,
        received: sql<number>`sum(${expenseSplit.received})`,
      })
      .from(expenseSplit)
      .innerJoin(expense, eq(expenseSplit.expenseId, expense.id))
      .where(
        and(
          eq(expense.userId, user.id),
          inArray(expense.cycleId, priorCycleIds)
        )
      )
      .groupBy(expenseSplit.memberId);

    priorAdditionalCosts = await db
      .select({
        memberId: memberAdditionalCost.memberId,
        amount: sql<number>`sum(${memberAdditionalCost.amount})`,
      })
      .from(memberAdditionalCost)
      .where(
        and(
          eq(memberAdditionalCost.userId, user.id),
          inArray(memberAdditionalCost.cycleId, priorCycleIds)
        )
      )
      .groupBy(memberAdditionalCost.memberId);

    priorPayments = await db
      .select({
        memberId: memberPayment.memberId,
        amount: sql<number>`sum(${memberPayment.amount})`,
      })
      .from(memberPayment)
      .where(
        and(
          eq(memberPayment.userId, user.id),
          inArray(memberPayment.cycleId, priorCycleIds)
        )
      )
      .groupBy(memberPayment.memberId);
  }

  const memberBreakdown = members.map((m) => {
    // Current cycle data
    const memberCycleSplits = cycleSplits.find(s => s.memberId === m.id);
    const splitTotal = memberCycleSplits?.amount ?? 0;
    const splitReceived = memberCycleSplits?.received ?? 0;
    
    const memberCyleCosts = additionalCosts.filter(c => c.memberId === m.id);
    const costTotal = memberCyleCosts.reduce((acc, c) => acc + c.amount, 0);
    
    const memberCyclePayments = payments.filter(p => p.memberId === m.id);
    const paymentTotal = memberCyclePayments.reduce((acc, p) => acc + p.amount, 0);

    const grandTotal = splitTotal + costTotal;

    // Prior cycle data
    const memberPriorSplits = priorSplits.find(s => s.memberId === m.id);
    const priorSplitTotal = memberPriorSplits?.amount ?? 0;
    const priorSplitReceived = memberPriorSplits?.received ?? 0;

    const memberPriorCost = priorAdditionalCosts.find(c => c.memberId === m.id)?.amount ?? 0;
    const memberPriorPayment = priorPayments.find(p => p.memberId === m.id)?.amount ?? 0;

    const priorTotalOwed = priorSplitTotal + memberPriorCost;
    const priorTotalPaid = priorSplitReceived + memberPriorPayment;
    const carryForward = priorTotalOwed - priorTotalPaid;

    const netPending = (grandTotal + carryForward) - (paymentTotal + splitReceived);

    return {
      id: m.id,
      name: m.name,
      splitTotal,
      additionalCosts: memberCyleCosts,
      costTotal,
      grandTotal,
      carryForward,
      totalOwed: grandTotal + carryForward,
      payments: memberCyclePayments,
      paymentTotal: paymentTotal + splitReceived,
      netPending,
    };
  });

  return apiResponse({
    cycle: currentCycle,
    totalSpend: totalSpend ?? 0,
    paymentMethodsSpend,
    memberBreakdown,
  });
}
