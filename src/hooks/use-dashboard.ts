import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-types";

export interface DashboardData {
  totalExpenses: number;
  transactionCount: number;
  totalSplitAmount: number;
  totalReceived: number;
  pendingAmount: number;
  categorySpending: Array<{
    categoryId: string;
    categoryName: string | null;
    categoryIcon: string | null;
    total: number;
    count: number;
  }>;
  memberSpending: Array<{
    memberId: string;
    memberName: string | null;
    totalAmount: number;
    totalReceived: number;
  }>;
  paymentMethodSpending: Array<{
    paymentMethodId: string;
    paymentMethodName: string | null;
    paymentMethodType: string | null;
    total: number;
    count: number;
  }>;
  recentExpenses: Array<{
    id: string;
    title: string;
    amount: number;
    date: string;
    categoryName: string | null;
    categoryIcon: string | null;
    paymentMethodName: string | null;
  }>;
}

export function useDashboard(cycleId?: string) {
  const params = new URLSearchParams();
  if (cycleId) params.set("cycleId", cycleId);

  return useQuery({
    queryKey: ["dashboard", cycleId],
    queryFn: () =>
      fetchApi<DashboardData>(
        `/api/dashboard${params.toString() ? `?${params.toString()}` : ""}`
      ),
  });
}
