import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, mutateApi, type PaginatedResponse, type ListResponse } from "@/lib/api-types";

export interface CategoryData {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useCategories(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["categories", page, limit],
    queryFn: () =>
      fetchApi<PaginatedResponse<CategoryData>>(`/api/categories?page=${page}&limit=${limit}`),
  });
}

export function useCategoriesList() {
  return useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => fetchApi<ListResponse<CategoryData>>("/api/categories?all=true"),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; icon?: string | null }) =>
      mutateApi("/api/categories", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; icon?: string | null }) =>
      mutateApi(`/api/categories/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mutateApi(`/api/categories/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
