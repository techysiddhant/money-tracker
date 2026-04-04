"use client";

import { useState } from "react";
import { CreditCard, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  type PaymentMethodData,
} from "@/hooks/use-payment-methods";
import { PAYMENT_METHOD_TYPES } from "@/lib/validators";
import { PageHeader } from "@/components/page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/format";

const typeColors: Record<string, string> = {
  card: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  upi: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  cash: "bg-green-500/10 text-green-600 dark:text-green-400",
  netbanking: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  wallet: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  other: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

export default function PaymentMethodsPage() {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethodData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("card");

  const query = usePaymentMethods(page);
  const items = query.data?.data ?? [];
  const pagination = query.data?.pagination;
  const isLoading = query.isLoading;
  const createMutation = useCreatePaymentMethod();
  const updateMutation = useUpdatePaymentMethod();
  const deleteMutation = useDeletePaymentMethod();

  const openCreate = () => {
    setEditing(null);
    setName("");
    setType("card");
    setFormOpen(true);
  };

  const openEdit = (pm: PaymentMethodData) => {
    setEditing(pm);
    setName(pm.name);
    setType(pm.type);
    setFormOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, name, type });
        toast.success("Payment method updated");
      } else {
        await createMutation.mutateAsync({ name, type });
        toast.success("Payment method created");
      }
      setFormOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast.success("Payment method deleted");
      setDeleteOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Methods"
        description="Manage your payment methods for tracking expenses"
        actionLabel="Add Payment Method"
        onAction={openCreate}
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !items.length ? (
            <EmptyState
              icon={CreditCard}
              title="No payment methods yet"
              description="Add your first payment method to start tracking expenses"
              actionLabel="Add Payment Method"
              onAction={openCreate}
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((pm) => (
                      <TableRow key={pm.id}>
                        <TableCell className="font-medium">{pm.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={typeColors[pm.type] || typeColors.other}
                          >
                            {pm.type.charAt(0).toUpperCase() + pm.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatTimestamp(pm.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEdit(pm)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => openDelete(pm.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y">
                {items.map((pm) => (
                  <div key={pm.id} className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{pm.name}</p>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${typeColors[pm.type] || typeColors.other}`}
                      >
                        {pm.type.charAt(0).toUpperCase() + pm.type.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(pm)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => openDelete(pm.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {pagination && (
                <PaginationControls
                  page={page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Payment Method" : "Add Payment Method"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pm-name">Name</Label>
              <Input
                id="pm-name"
                placeholder="e.g. Axis Flipkart Card"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pm-type">Type</Label>
              <Combobox
                id="pm-type"
                options={PAYMENT_METHOD_TYPES.map((t) => ({
                  label: t.charAt(0).toUpperCase() + t.slice(1),
                  value: t,
                }))}
                value={type}
                onChange={setType}
                placeholder="Select payment method type"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating
                ? "Saving..."
                : editing
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Payment Method"
        description="Are you sure you want to delete this payment method? This action cannot be undone. Note: You cannot delete a payment method that has associated expenses."
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
