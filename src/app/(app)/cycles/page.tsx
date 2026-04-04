"use client";

import { useState } from "react";
import { RefreshCw, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import {
  useCycles,
  useCreateCycle,
  useUpdateCycle,
  type CycleData,
} from "@/hooks/use-cycles";
import { PageHeader } from "@/components/page-header";
import { PaginationControls } from "@/components/pagination-controls";
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
import { formatDate } from "@/lib/format";

export default function CyclesPage() {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CycleData | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("active");

  const query = useCycles(page);
  const items = query.data?.data ?? [];
  const pagination = query.data?.pagination;
  const isLoading = query.isLoading;
  const createMutation = useCreateCycle();
  const updateMutation = useUpdateCycle();

  const openCreate = () => {
    setEditing(null);
    setName("");
    setStartDate("");
    setEndDate("");
    setStatus("active");
    setFormOpen(true);
  };

  const openEdit = (c: CycleData) => {
    setEditing(c);
    setName(c.name);
    setStartDate(c.startDate);
    setEndDate(c.endDate);
    setStatus(c.status);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          name,
          status,
        });
        toast.success("Cycle updated");
      } else {
        if (!startDate || !endDate) {
          toast.error("Start and end dates are required");
          return;
        }
        await createMutation.mutateAsync({ name, startDate, endDate });
        toast.success("Cycle created");
      }
      setFormOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cycles"
        description="Manage expense tracking periods"
        actionLabel="Add Cycle"
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
              icon={RefreshCw}
              title="No cycles yet"
              description="Create a cycle to track expenses within a time period"
              actionLabel="Add Cycle"
              onAction={openCreate}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-sm">{formatDate(c.startDate)}</TableCell>
                        <TableCell className="text-sm">{formatDate(c.endDate)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              c.status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                            }
                          >
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEdit(c)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden divide-y">
                {items.map((c) => (
                  <div key={c.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            c.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(c.startDate)} → {formatDate(c.endDate)}
                    </p>
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Cycle" : "Add Cycle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cycle-name">Name</Label>
              <Input
                id="cycle-name"
                placeholder="e.g. April 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {!editing && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cycle-start">Start Date</Label>
                  <Input
                    id="cycle-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cycle-end">End Date</Label>
                  <Input
                    id="cycle-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            {editing && (
              <div className="space-y-2">
                <Label htmlFor="cycle-status">Status</Label>
                <Combobox
                  id="cycle-status"
                  options={[
                    { label: "Active", value: "active" },
                    { label: "Closed", value: "closed" },
                  ]}
                  value={status}
                  onChange={setStatus}
                  placeholder="Select status"
                />
                {editing.status === "closed" && (
                  <p className="text-xs text-destructive">
                    Closed cycles cannot be reopened
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
