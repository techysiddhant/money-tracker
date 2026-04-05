"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check, Divide } from "lucide-react";
import toast from "react-hot-toast";
import { useCyclesList } from "@/hooks/use-cycles";
import { useCategoriesList } from "@/hooks/use-categories";
import { usePaymentMethodsList } from "@/hooks/use-payment-methods";
import { useMembersList } from "@/hooks/use-members";
import { useExpenseFormStore, type SplitRow } from "@/stores/use-expense-form-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Combobox } from "@/components/ui/combobox";
import { formatCurrency } from "@/lib/format";

interface ExpenseFormProps {
  mode: "create" | "edit";
  defaultValues?: {
    title: string;
    amount: string;
    date: string;
    cycleId: string;
    categoryId: string;
    paymentMethodId: string;
    comment: string;
  };
  onSubmit: (data: {
    title: string;
    amount: number;
    date: string;
    cycleId: string;
    categoryId: string;
    paymentMethodId: string;
    comment: string | null;
    splits: Array<{ memberId: string; amount: number; received: number }>;
  }) => Promise<void>;
  isPending: boolean;
}

export function ExpenseForm({ mode, defaultValues, onSubmit, isPending }: ExpenseFormProps) {
  const router = useRouter();
  const { data: cyclesData } = useCyclesList();
  const { data: categoriesData } = useCategoriesList();
  const { data: pmData } = usePaymentMethodsList();
  const { data: membersData } = useMembersList();

  const splits = useExpenseFormStore((s) => s.splits);
  const addSplitRow = useExpenseFormStore((s) => s.addSplitRow);
  const updateSplit = useExpenseFormStore((s) => s.updateSplit);
  const removeSplit = useExpenseFormStore((s) => s.removeSplit);
  const confirmSplit = useExpenseFormStore((s) => s.confirmSplit);
  const autoSplit = useExpenseFormStore((s) => s.autoSplit);

  const activeCycles =
    mode === "create"
      ? cyclesData?.data?.filter((c) => c.status === "active") || []
      : cyclesData?.data || [];
  const members = membersData?.data || [];

  const form = useForm({
    defaultValues: {
      title: defaultValues?.title ?? "",
      amount: defaultValues?.amount ?? "",
      date: defaultValues?.date ?? new Date().toISOString().split("T")[0],
      cycleId: defaultValues?.cycleId ?? "",
      categoryId: defaultValues?.categoryId ?? "",
      paymentMethodId: defaultValues?.paymentMethodId ?? "",
      comment: defaultValues?.comment ?? "",
    },
    onSubmit: async ({ value }) => {
      const parsedAmount = parseFloat(value.amount);
      if (!value.title.trim()) { toast.error("Title is required"); return; }
      if (!parsedAmount) { toast.error("Amount is required"); return; }
      if (!value.date) { toast.error("Date is required"); return; }
      if (!value.cycleId) { toast.error("Cycle is required"); return; }
      if (!value.categoryId) { toast.error("Category is required"); return; }
      if (!value.paymentMethodId) { toast.error("Payment method is required"); return; }

      const confirmedSplits = splits.filter((s) => s.confirmed && s.memberId);

      try {
        await onSubmit({
          title: value.title,
          amount: parsedAmount,
          date: value.date,
          cycleId: value.cycleId,
          categoryId: value.categoryId,
          paymentMethodId: value.paymentMethodId,
          comment: value.comment || null,
          splits: confirmedSplits.map((s) => ({
            memberId: s.memberId,
            amount: s.amount,
            received: s.received,
          })),
        });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    },
  });

  const totalSplitAmount = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const currentAmount = parseFloat(form.getFieldValue("amount")) || 0;

  const handleAutoSplit = () => {
    if (!currentAmount || splits.length === 0) {
      toast.error("Add members and enter total amount first");
      return;
    }
    autoSplit(currentAmount);
    toast.success("Amount split equally among members");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/expenses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {mode === "create" ? "Add Expense" : "Edit Expense"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Create a new expense record with optional member splits"
              : "Update expense details and member splits"}
          </p>
        </div>
      </div>

      {/* Expense Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <form.Field name="title">
              {(field) => (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="exp-title">Title *</Label>
                  <Input
                    id="exp-title"
                    placeholder="e.g. Dinner at restaurant"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="amount">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="exp-amount">Total Amount (₹) *</Label>
                  <Input
                    id="exp-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="date">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="exp-date">Date *</Label>
                  <Input
                    id="exp-date"
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="cycleId">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="exp-cycle">Cycle *</Label>
                  <Combobox
                    id="exp-cycle"
                    options={activeCycles.map((c) => ({ label: c.name, value: c.id }))}
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    placeholder="Select cycle"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="categoryId">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="exp-category">Category *</Label>
                  <Combobox
                    id="exp-category"
                    options={
                      categoriesData?.data?.map((c) => ({
                        label: `${c.icon ? c.icon + " " : ""}${c.name}`,
                        value: c.id,
                      })) || []
                    }
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    placeholder="Select category"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="paymentMethodId">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="exp-pm">Payment Method *</Label>
                  <Combobox
                    id="exp-pm"
                    options={
                      pmData?.data?.map((p) => ({
                        label: p.name,
                        value: p.id,
                      })) || []
                    }
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    placeholder="Select payment method"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="comment">
              {(field) => (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="exp-comment">Comment (optional)</Label>
                  <Textarea
                    id="exp-comment"
                    placeholder="Add a note..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    rows={3}
                  />
                </div>
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      {/* Member Splits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Member Splits</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoSplit}
                disabled={splits.length === 0 || !currentAmount}
                className="gap-1.5"
              >
                <Divide className="h-3.5 w-3.5" />
                Auto Split
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addSplitRow}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Member
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {splits.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No members added yet. Click &quot;Add Member&quot; to split this expense.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {splits.map((split) => (
                  <SplitRowItem
                    key={split.tempId}
                    split={split}
                    members={members}
                    allSplits={splits}
                    onUpdate={updateSplit}
                    onRemove={removeSplit}
                    onConfirm={confirmSplit}
                  />
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Split Amount</span>
                <span
                  className={`font-mono font-semibold ${
                    currentAmount &&
                    Math.abs(totalSplitAmount - currentAmount) > 0.01
                      ? "text-destructive"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {formatCurrency(totalSplitAmount)} / {formatCurrency(currentAmount)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button variant="outline" asChild>
          <Link href="/expenses">Cancel</Link>
        </Button>
        <Button
          onClick={() => form.handleSubmit()}
          disabled={isPending}
          className="min-w-[120px]"
        >
          {isPending
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
              ? "Create Expense"
              : "Update Expense"}
        </Button>
      </div>
    </div>
  );
}

// ─── Split Row Sub-Component ─────────────────────────────────────────────────

function SplitRowItem({
  split,
  members,
  allSplits,
  onUpdate,
  onRemove,
  onConfirm,
}: {
  split: SplitRow;
  members: Array<{ id: string; name: string }>;
  allSplits: SplitRow[];
  onUpdate: (tempId: string, field: keyof SplitRow, value: unknown) => void;
  onRemove: (tempId: string) => void;
  onConfirm: (tempId: string) => void;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row gap-3 p-3 rounded-lg border ${
        split.confirmed
          ? "bg-muted/50 border-primary/20"
          : "border-dashed"
      }`}
    >
      <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:gap-3">
        <Combobox
          options={members
            .filter(
              (m) =>
                m.id === split.memberId ||
                !allSplits.find(
                  (s) => s.memberId === m.id && s.tempId !== split.tempId
                )
            )
            .map((m) => ({ label: m.name, value: m.id }))}
          value={split.memberId}
          onChange={(v) => onUpdate(split.tempId, "memberId", v)}
          placeholder="Select member"
          className="sm:w-[180px]"
        />

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount"
              value={split.amount || ""}
              onChange={(e) =>
                onUpdate(split.tempId, "amount", parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div className="flex-1">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Received"
              value={split.received || ""}
              onChange={(e) =>
                onUpdate(split.tempId, "received", parseFloat(e.target.value) || 0)
              }
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
        {!split.confirmed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-emerald-600"
            onClick={() => onConfirm(split.tempId)}
            disabled={!split.memberId}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={() => onRemove(split.tempId)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
