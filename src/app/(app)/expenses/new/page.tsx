"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCreateExpense } from "@/hooks/use-expenses";
import { useExpenseFormStore } from "@/stores/use-expense-form-store";
import { ExpenseForm } from "@/components/expense-form";

export default function NewExpensePage() {
  const router = useRouter();
  const createMutation = useCreateExpense();
  const resetSplits = useExpenseFormStore((s) => s.resetSplits);

  // Reset split rows when mounting the create page
  useEffect(() => {
    resetSplits();
  }, [resetSplits]);

  return (
    <ExpenseForm
      mode="create"
      isPending={createMutation.isPending}
      onSubmit={async (data) => {
        await createMutation.mutateAsync(data);
        toast.success("Expense created");
        router.push("/expenses");
      }}
    />
  );
}
