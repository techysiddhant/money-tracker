"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import toast from "react-hot-toast";
import { useCyclesList } from "@/hooks/use-cycles";
import { 
  useFinancials, 
  useRecordPayment, 
  useAddAdditionalCost, 
  useDeleteAdditionalCost 
} from "@/hooks/use-financials";

import { PageHeader } from "@/components/page-header";
import { Combobox } from "@/components/ui/combobox";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertCircle, IndianRupee, MinusCircle, PlusCircle, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

export default function FinancialsPage() {
  const { data: cyclesData, isLoading: isLoadingCycles } = useCyclesList();
  
  // Only show closed cycles
  const closedCycles = cyclesData?.data?.filter((c) => c.status === "closed") || [];
  
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");

  // Default select the latest closed cycle
  if (!selectedCycleId && closedCycles.length > 0) {
    setSelectedCycleId(closedCycles[0].id);
  }

  const { data: financials, isLoading: isLoadingFinancials } = useFinancials(selectedCycleId || null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financials"
        description="Review spending and settlements for closed cycles"
      >
        <div className="flex bg-background px-1 py-1 rounded-md border w-full sm:w-[250px]">
          <Combobox
            options={closedCycles.map((c) => ({ label: c.name, value: c.id }))}
            value={selectedCycleId}
            onChange={(v) => setSelectedCycleId(v)}
            placeholder={isLoadingCycles ? "Loading..." : "Select closed cycle"}
            className="border-0 shadow-none w-full bg-transparent focus:ring-0"
          />
        </div>
      </PageHeader>

      {isLoadingCycles ? (
        <Skeleton className="h-[400px] w-full" />
      ) : closedCycles.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No closed cycles yet"
          description="Financial settlements are generated after you close a cycle. Go to your Cycles and close one to see data here."
        />
      ) : isLoadingFinancials ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : financials ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Total Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-primary">
                  {formatCurrency(financials.totalSpend)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Payment Methods Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {financials.paymentMethodsSpend.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Members Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {financials.memberBreakdown.filter(m => m.grandTotal > 0 || m.carryForward !== 0).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Method Breakdown */}
            <Card className="lg:col-span-1 border-t-4 border-t-blue-500">
              <CardHeader>
                <CardTitle className="text-lg">Payment Methods</CardTitle>
                <CardDescription>Spend per payment instrument</CardDescription>
              </CardHeader>
              <CardContent>
                {financials.paymentMethodsSpend.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">No expenses found</div>
                ) : (
                  <div className="space-y-4">
                    {financials.paymentMethodsSpend.map(pm => (
                      <div key={pm.paymentMethodId} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                        <span className="font-medium">{pm.name}</span>
                        <span className="font-mono text-muted-foreground">{formatCurrency(pm.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Member Breakdown */}
            <Card className="lg:col-span-2 border-t-4 border-t-emerald-500">
              <CardHeader>
                <CardTitle className="text-lg">Member Settlements</CardTitle>
                <CardDescription>Track debts, extra costs, and payments for all members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto space-y-6">
                  {financials.memberBreakdown.map(member => (
                    <div key={member.id} className="border p-4 rounded-xl space-y-4 bg-muted/20">
                      
                      <div className="flex items-center justify-between pb-2 border-b">
                        <div className="font-bold text-lg">{member.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Net Pending:</span>
                          <Badge variant={member.netPending > 0 ? "destructive" : member.netPending < 0 ? "secondary" : "outline"} className="text-sm font-mono px-2 py-1">
                            {formatCurrency(member.netPending)}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        
                        {/* Left column (Owed variables) */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-muted-foreground flex items-center gap-1.5"><MinusCircle className="h-3.5 w-3.5" /> AMOUNTS OWED</h4>
                          
                          <div className="flex justify-between">
                            <span>Expense Splits:</span>
                            <span className="font-mono">{formatCurrency(member.splitTotal)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                              Additional Costs:
                              <AddCostDialog cycleId={selectedCycleId} member={member} />
                            </span>
                            <span className="font-mono">{formatCurrency(member.costTotal)}</span>
                          </div>

                          <div className="flex justify-between text-muted-foreground">
                            <span>Old Carry Forward:</span>
                            <span className="font-mono">{formatCurrency(member.carryForward)}</span>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex justify-between font-semibold py-1">
                            <span>Total Owed:</span>
                            <span className="font-mono">{formatCurrency(member.totalOwed)}</span>
                          </div>
                        </div>

                        {/* Right column (Paid variables) */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5"><PlusCircle className="h-3.5 w-3.5" /> PAYMENTS RECEIVED</h4>
                          
                          <div className="flex justify-between">
                            <span>Received (via Form):</span>
                            <span className="font-mono">{formatCurrency(member.paymentTotal - member.payments.reduce((a,b)=>a+b.amount,0))}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                              Direct Payments:
                              <RecordPaymentDialog cycleId={selectedCycleId} member={member} />
                            </span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-500">{formatCurrency(member.payments.reduce((a,b)=>a+b.amount,0))}</span>
                          </div>

                          <div className="flex flex-col gap-1 pl-4 mt-2 border-l-2 border-emerald-500/20 text-xs">
                           {member.payments.map(p => (
                             <div key={p.id} className="flex justify-between opacity-80">
                               <span className="truncate max-w-[120px]">{p.note || "Payment"}</span>
                               <span className="font-mono">{formatCurrency(p.amount)}</span>
                             </div>
                           ))}
                          </div>
                          
                          <Separator className="mt-4!" />
                          
                          <div className="flex justify-between font-semibold py-1">
                            <span>Total Received:</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-500">{formatCurrency(member.paymentTotal)}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Dialogs ──────────────────────────────────────────────────────────────

function RecordPaymentDialog({ cycleId, member }: { cycleId: string, member: any }) {
  const [open, setOpen] = useState(false);
  const mutation = useRecordPayment();

  const form = useForm({
    defaultValues: { amount: "", note: "" },
    onSubmit: async ({ value }) => {
      const num = parseFloat(value.amount);
      if (!num || num <= 0) {
        toast.error("Enter a valid amount");
        return;
      }
      try {
        await mutation.mutateAsync({
          cycleId,
          memberId: member.id,
          amount: num,
          note: value.note || undefined,
        });
        toast.success("Payment recorded");
        setOpen(false);
        form.reset();
      } catch (err: unknown) {
        toast.error("Failed to record payment");
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-xs px-2 cursor-pointer border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300">
          + Record
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment from {member.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <form.Field name="amount">
            {(field) => (
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="note">
            {(field) => (
              <div className="space-y-2">
                <Label>Note (Optional)</Label>
                <Input
                  type="text"
                  placeholder="e.g. Bank transfer"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>
          <Button disabled={mutation.isPending} className="w-full" onClick={() => form.handleSubmit()}>
            {mutation.isPending ? "Recording..." : "Confirm Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function AddCostDialog({ cycleId, member }: { cycleId: string, member: any }) {
  const [open, setOpen] = useState(false);
  const mutation = useAddAdditionalCost();
  const deleteMutation = useDeleteAdditionalCost();

  const form = useForm({
    defaultValues: { amount: "", description: "" },
    onSubmit: async ({ value }) => {
      const num = parseFloat(value.amount);
      if (!num || num <= 0) {
        toast.error("Enter a valid amount");
        return;
      }
      if (!value.description.trim()) {
        toast.error("Enter a description");
        return;
      }
      try {
        await mutation.mutateAsync({
          cycleId,
          memberId: member.id,
          amount: num,
          description: value.description,
        });
        toast.success("Cost added");
        setOpen(false);
        form.reset();
      } catch (err: unknown) {
        toast.error("Failed to add cost");
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-xs px-2 cursor-pointer">
          + Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Additional Costs for {member.name}</DialogTitle>
        </DialogHeader>
        
        {member.additionalCosts.length > 0 && (
          <div className="space-y-2 mt-4">
            <Label className="text-xs text-muted-foreground">Existing Costs</Label>
            <div className="border rounded-md divide-y overflow-y-auto max-h-[150px]">
              {member.additionalCosts.map((c: any) => (
                <div key={c.id} className="flex justify-between items-center p-2 text-sm bg-muted/30">
                  <span className="truncate max-w-[180px]">{c.description}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{formatCurrency(c.amount)}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={async () => {
                        try {
                          await deleteMutation.mutateAsync(c.id);
                          toast.success("Cost removed");
                        } catch(e) {
                          toast.error("Failed to remove cost");
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 py-4 pt-6 border-t mt-4">
          <form.Field name="description">
            {(field) => (
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  type="text"
                  placeholder="e.g. Flight ticket"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="amount">
            {(field) => (
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>
          <Button disabled={mutation.isPending} className="w-full" onClick={() => form.handleSubmit()}>
            {mutation.isPending ? "Adding..." : "Add New Cost"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
