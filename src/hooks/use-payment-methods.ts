import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, mutateApi, type PaginatedResponse, type ListResponse } from "@/lib/api-types";

export interface PaymentMethodData {
  id: string;
  userId: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export function usePaymentMethods(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["payment-methods", page, limit],
    queryFn: () =>
      fetchApi<PaginatedResponse<PaymentMethodData>>(
        `/api/payment-methods?page=${page}&limit=${limit}`
      ),
  });
}

export function usePaymentMethodsList() {
  return useQuery({
    queryKey: ["payment-methods", "all"],
    queryFn: () =>
      fetchApi<ListResponse<PaymentMethodData>>("/api/payment-methods?all=true"),
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; type: string }) =>
      mutateApi("/api/payment-methods", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; type?: string }) =>
      mutateApi(`/api/payment-methods/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateApi(`/api/payment-methods/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}
