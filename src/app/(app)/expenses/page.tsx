"use client";

import { useState } from "react";
import Link from "next/link";
import { Receipt, Trash2, Eye, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useExpenses, useDeleteExpense } from "@/hooks/use-expenses";
import { useCyclesList } from "@/hooks/use-cycles";
import { useCategoriesList } from "@/hooks/use-categories";
import { usePaymentMethodsList } from "@/hooks/use-payment-methods";
import { PageHeader } from "@/components/page-header";
import { PaginationControls } from "@/components/pagination-controls";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatCurrency, formatDate } from "@/lib/format";
import { useRouter } from "next/navigation";

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    cycleId?: string;
    categoryId?: string;
    paymentMethodId?: string;
  }>({});

  const query = useExpenses(page, 10, filters);
  const items = query.data?.data ?? [];
  const pagination = query.data?.pagination;
  const isLoading = query.isLoading;
  const router = useRouter();
  const deleteMutation = useDeleteExpense();
  const { data: cyclesData } = useCyclesList();
  const { data: categoriesData } = useCategoriesList();
  const { data: pmData } = usePaymentMethodsList();

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast.success("Expense deleted");
      setDeleteOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const updateFilter = (key: string, value: string | undefined) => {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and manage all your expenses"
      >
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/expenses/new">
            <Plus className="h-4 w-4" />
            Add Expense
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <Combobox
          options={[
            { label: "All Cycles", value: "all" },
            ...(cyclesData?.data?.map((c) => ({ label: c.name, value: c.id })) || []),
          ]}
          value={filters.cycleId || "all"}
          onChange={(v) => updateFilter("cycleId", v)}
          placeholder="All Cycles"
          className="w-full sm:w-[200px]"
        />

        <Combobox
          options={[
            { label: "All Categories", value: "all" },
            ...(categoriesData?.data?.map((c) => ({ label: `${c.icon ? c.icon + " " : ""}${c.name}`, value: c.id })) || []),
          ]}
          value={filters.categoryId || "all"}
          onChange={(v) => updateFilter("categoryId", v)}
          placeholder="All Categories"
          className="w-full sm:w-[200px]"
        />

        <Combobox
          options={[
            { label: "All Payment Methods", value: "all" },
            ...(pmData?.data?.map((p) => ({ label: p.name, value: p.id })) || []),
          ]}
          value={filters.paymentMethodId || "all"}
          onChange={(v) => updateFilter("paymentMethodId", v)}
          placeholder="All Payment Methods"
          className="w-full sm:w-[200px]"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !items.length ? (
            <EmptyState
              icon={Receipt}
              title="No expenses found"
              description={
                Object.values(filters).some(Boolean)
                  ? "No expenses match your current filters"
                  : "Add your first expense to start tracking"
              }
              actionLabel="Add Expense"
              onAction={() => router.push("/expenses/new")}
            />
          ) : (
            <>
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Splits</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {e.title}
                        </TableCell>
                        <TableCell className="font-mono font-semibold">
                          {formatCurrency(e.amount)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(e.date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {e.cycleName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {e.categoryIcon ? `${e.categoryIcon} ` : ""}
                            {e.categoryName}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {e.paymentMethodName}
                        </TableCell>
                        <TableCell>
                          {(e.splitCount ?? 0) > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {e.splitCount} split{(e.splitCount ?? 0) > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  asChild
                                >
                                  <Link href={`/expenses/${e.id}/edit`}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View / Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => openDelete(e.id)}
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
              <div className="lg:hidden divide-y">
                {items.map((e) => (
                  <div key={e.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{e.title}</p>
                        <p className="font-mono font-semibold text-base">
                          {formatCurrency(e.amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/expenses/${e.id}/edit`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => openDelete(e.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">{e.cycleName}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {e.categoryIcon} {e.categoryName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(e.date)}
                      </span>
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

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This will also remove all associated splits. This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
