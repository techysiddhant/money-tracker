"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useExpense, useUpdateExpense } from "@/hooks/use-expenses";
import { useExpenseFormStore } from "@/stores/use-expense-form-store";
import { ExpenseForm } from "@/components/expense-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditExpensePage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { data: expenseData, isLoading } = useExpense(params.id);
  const updateMutation = useUpdateExpense();
  const setSplits = useExpenseFormStore((s) => s.setSplits);

  // Populate split rows from fetched expense data
  useEffect(() => {
    if (expenseData?.splits) {
      setSplits(
        expenseData.splits.map((s) => ({
          tempId: crypto.randomUUID(),
          memberId: s.memberId,
          amount: s.amount,
          received: s.received,
          confirmed: true,
        }))
      );
    }
  }, [expenseData, setSplits]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <ExpenseForm
      mode="edit"
      defaultValues={
        expenseData
          ? {
              title: expenseData.title,
              amount: String(expenseData.amount),
              date: expenseData.date,
              cycleId: expenseData.cycleId,
              categoryId: expenseData.categoryId,
              paymentMethodId: expenseData.paymentMethodId,
              comment: expenseData.comment || "",
            }
          : undefined
      }
      isPending={updateMutation.isPending}
      onSubmit={async (data) => {
        await updateMutation.mutateAsync({ id: params.id, ...data });
        toast.success("Expense updated");
        router.push("/expenses");
      }}
    />
  );
}
