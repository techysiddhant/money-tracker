import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, mutateApi } from "@/lib/api-types";

export interface MemberFinancialBreakdown {
  id: string;
  name: string;
  splitTotal: number;
  additionalCosts: {
    id: string;
    amount: number;
    description: string;
  }[];
  costTotal: number;
  grandTotal: number;
  carryForward: number;
  totalOwed: number;
  payments: {
    id: string;
    amount: number;
    note: string | null;
    createdAt: string;
  }[];
  paymentTotal: number;
  netPending: number;
}

export interface FinancialSummaryData {
  cycle: {
    id: string;
    name: string;
    status: string;
  };
  totalSpend: number;
  paymentMethodsSpend: {
    paymentMethodId: string;
    name: string;
    amount: number;
  }[];
  memberBreakdown: MemberFinancialBreakdown[];
}

export function useFinancials(cycleId: string | null) {
  return useQuery({
    queryKey: ["financials", cycleId],
    queryFn: () => fetchApi<FinancialSummaryData>(`/api/financials?cycleId=${cycleId}`),
    enabled: !!cycleId,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      cycleId: string;
      memberId: string;
      amount: number;
      note?: string;
    }) => mutateApi("/api/financials/payments", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financials"] });
    },
  });
}

export function useAddAdditionalCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      cycleId: string;
      memberId: string;
      amount: number;
      description: string;
    }) => mutateApi("/api/financials/additional-costs", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financials"] });
    },
  });
}

export function useDeleteAdditionalCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (costId: string) => mutateApi(`/api/financials/additional-costs?id=${costId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financials"] });
    },
  });
}
