import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, mutateApi, type PaginatedResponse } from "@/lib/api-types";

export interface ExpenseSplitData {
  id: string;
  memberId: string;
  memberName: string | null;
  amount: number;
  received: number;
  createdAt: string;
}

export interface ExpenseData {
  id: string;
  title: string;
  amount: number;
  date: string;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  cycleId: string;
  cycleName: string | null;
  categoryId: string;
  categoryName: string | null;
  categoryIcon: string | null;
  paymentMethodId: string;
  paymentMethodName: string | null;
  paymentMethodType: string | null;
  splitCount?: number;
  splits?: ExpenseSplitData[];
}

export function useExpenses(
  page = 1,
  limit = 10,
  filters?: {
    cycleId?: string;
    categoryId?: string;
    paymentMethodId?: string;
  }
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters?.cycleId) params.set("cycleId", filters.cycleId);
  if (filters?.categoryId) params.set("categoryId", filters.categoryId);
  if (filters?.paymentMethodId)
    params.set("paymentMethodId", filters.paymentMethodId);

  return useQuery({
    queryKey: ["expenses", page, limit, filters],
    queryFn: () =>
      fetchApi<PaginatedResponse<ExpenseData>>(`/api/expenses?${params.toString()}`),
  });
}

export function useExpense(id: string | null) {
  return useQuery({
    queryKey: ["expense", id],
    queryFn: () => fetchApi<ExpenseData>(`/api/expenses/${id}`),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      amount: number;
      date: string;
      cycleId: string;
      categoryId: string;
      paymentMethodId: string;
      comment?: string | null;
      splits?: Array<{ memberId: string; amount: number; received: number }>;
    }) => mutateApi("/api/expenses", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      amount?: number;
      date?: string;
      cycleId?: string;
      categoryId?: string;
      paymentMethodId?: string;
      comment?: string | null;
      splits?: Array<{ memberId: string; amount: number; received: number }>;
    }) => mutateApi(`/api/expenses/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mutateApi(`/api/expenses/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
