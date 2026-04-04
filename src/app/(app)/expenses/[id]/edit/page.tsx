"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check, Divide } from "lucide-react";
import toast from "react-hot-toast";
import { useExpense, useUpdateExpense } from "@/hooks/use-expenses";
import { useCyclesList } from "@/hooks/use-cycles";
import { useCategoriesList } from "@/hooks/use-categories";
import { usePaymentMethodsList } from "@/hooks/use-payment-methods";
import { useMembersList } from "@/hooks/use-members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Combobox } from "@/components/ui/combobox";
import { formatCurrency } from "@/lib/format";

interface SplitRow {
  tempId: string;
  memberId: string;
  amount: number;
  received: number;
  confirmed: boolean;
}

export default function EditExpensePage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { data: expenseData, isLoading } = useExpense(params.id);
  const updateMutation = useUpdateExpense();

  const { data: cyclesData } = useCyclesList();
  const { data: categoriesData } = useCategoriesList();
  const { data: pmData } = usePaymentMethodsList();
  const { data: membersData } = useMembersList();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [comment, setComment] = useState("");
  const [splits, setSplits] = useState<SplitRow[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (expenseData && !initialized) {
      setTitle(expenseData.title);
      setAmount(String(expenseData.amount));
      setDate(expenseData.date);
      setCycleId(expenseData.cycleId);
      setCategoryId(expenseData.categoryId);
      setPaymentMethodId(expenseData.paymentMethodId);
      setComment(expenseData.comment || "");
      setSplits(
        (expenseData.splits || []).map((s) => ({
          tempId: crypto.randomUUID(),
          memberId: s.memberId,
          amount: s.amount,
          received: s.received,
          confirmed: true,
        }))
      );
      setInitialized(true);
    }
  }, [expenseData, initialized]);

  const members = membersData?.data || [];

  const addSplitRow = () => {
    setSplits((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        memberId: "",
        amount: 0,
        received: 0,
        confirmed: false,
      },
    ]);
  };

  const updateSplit = (tempId: string, field: keyof SplitRow, value: unknown) => {
    setSplits((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, [field]: value } : s))
    );
  };

  const removeSplit = (tempId: string) => {
    setSplits((prev) => prev.filter((s) => s.tempId !== tempId));
  };

  const confirmSplit = (tempId: string) => {
    setSplits((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, confirmed: true } : s))
    );
  };

  const autoSplit = () => {
    const totalAmount = parseFloat(amount);
    if (!totalAmount || splits.length === 0) {
      toast.error("Add members and enter total amount first");
      return;
    }

    const splitAmount = Math.round((totalAmount / splits.length) * 100) / 100;
    const remainder =
      Math.round((totalAmount - splitAmount * splits.length) * 100) / 100;

    setSplits((prev) =>
      prev.map((s, i) => ({
        ...s,
        amount: i === 0 ? splitAmount + remainder : splitAmount,
        confirmed: true,
      }))
    );
    toast.success("Amount split equally among members");
  };

  const totalSplitAmount = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const parsedAmount = parseFloat(amount) || 0;

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!parsedAmount) { toast.error("Amount is required"); return; }
    if (!date) { toast.error("Date is required"); return; }
    if (!cycleId) { toast.error("Cycle is required"); return; }
    if (!categoryId) { toast.error("Category is required"); return; }
    if (!paymentMethodId) { toast.error("Payment method is required"); return; }

    const confirmedSplits = splits.filter((s) => s.confirmed && s.memberId);

    try {
      await updateMutation.mutateAsync({
        id: params.id,
        title,
        amount: parsedAmount,
        date,
        cycleId,
        categoryId,
        paymentMethodId,
        comment: comment || null,
        splits: confirmedSplits.map((s) => ({
          memberId: s.memberId,
          amount: s.amount,
          received: s.received,
        })),
      });
      toast.success("Expense updated");
      router.push("/expenses");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

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
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/expenses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Edit Expense
          </h1>
          <p className="text-sm text-muted-foreground">
            Update expense details and member splits
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="exp-title">Title *</Label>
              <Input
                id="exp-title"
                placeholder="e.g. Dinner at restaurant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-amount">Total Amount (₹) *</Label>
              <Input
                id="exp-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-date">Date *</Label>
              <Input
                id="exp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-cycle">Cycle *</Label>
              <Combobox
                id="exp-cycle"
                options={cyclesData?.data?.map((c) => ({ label: c.name, value: c.id })) || []}
                value={cycleId}
                onChange={setCycleId}
                placeholder="Select cycle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-category">Category *</Label>
              <Combobox
                id="exp-category"
                options={categoriesData?.data?.map((c) => ({ label: `${c.icon ? c.icon + " " : ""}${c.name}`, value: c.id })) || []}
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Select category"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-pm">Payment Method *</Label>
              <Combobox
                id="exp-pm"
                options={pmData?.data?.map((p) => ({ label: p.name, value: p.id })) || []}
                value={paymentMethodId}
                onChange={setPaymentMethodId}
                placeholder="Select payment method"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="exp-comment">Comment (optional)</Label>
              <Textarea
                id="exp-comment"
                placeholder="Add a note..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Member Splits</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={autoSplit}
                disabled={splits.length === 0 || !parsedAmount}
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
              No members added. Click &quot;Add Member&quot; to split this expense.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {splits.map((split) => (
                  <div
                    key={split.tempId}
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
                              !splits.find(
                                (s) =>
                                  s.memberId === m.id &&
                                  s.tempId !== split.tempId
                              )
                          )
                          .map((m) => ({ label: m.name, value: m.id }))}
                        value={split.memberId}
                        onChange={(v) => updateSplit(split.tempId, "memberId", v)}
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
                              updateSplit(
                                split.tempId,
                                "amount",
                                parseFloat(e.target.value) || 0
                              )
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
                              updateSplit(
                                split.tempId,
                                "received",
                                parseFloat(e.target.value) || 0
                              )
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
                          onClick={() => confirmSplit(split.tempId)}
                          disabled={!split.memberId}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeSplit(split.tempId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Total Split Amount
                </span>
                <span
                  className={`font-mono font-semibold ${
                    parsedAmount &&
                    Math.abs(totalSplitAmount - parsedAmount) > 0.01
                      ? "text-destructive"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {formatCurrency(totalSplitAmount)} / {formatCurrency(parsedAmount)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pb-8">
        <Button variant="outline" asChild>
          <Link href="/expenses">Cancel</Link>
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="min-w-[120px]"
        >
          {updateMutation.isPending ? "Updating..." : "Update Expense"}
        </Button>
      </div>
    </div>
  );
}
