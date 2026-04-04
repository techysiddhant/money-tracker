import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, mutateApi, type PaginatedResponse, type ListResponse } from "@/lib/api-types";

export interface CycleData {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function useCycles(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["cycles", page, limit],
    queryFn: () =>
      fetchApi<PaginatedResponse<CycleData>>(`/api/cycles?page=${page}&limit=${limit}`),
  });
}

export function useCyclesList() {
  return useQuery({
    queryKey: ["cycles", "all"],
    queryFn: () => fetchApi<ListResponse<CycleData>>("/api/cycles?all=true"),
  });
}

export function useCreateCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; startDate: string; endDate: string }) =>
      mutateApi("/api/cycles", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
    },
  });
}

export function useUpdateCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; status?: string }) =>
      mutateApi(`/api/cycles/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
    },
  });
}
