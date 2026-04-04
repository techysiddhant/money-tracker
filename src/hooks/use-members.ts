import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, mutateApi, type PaginatedResponse, type ListResponse } from "@/lib/api-types";

export interface MemberData {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export function useMembers(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["members", page, limit],
    queryFn: () =>
      fetchApi<PaginatedResponse<MemberData>>(`/api/members?page=${page}&limit=${limit}`),
  });
}

export function useMembersList() {
  return useQuery({
    queryKey: ["members", "all"],
    queryFn: () => fetchApi<ListResponse<MemberData>>("/api/members?all=true"),
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      mutateApi("/api/members", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      mutateApi(`/api/members/${id}`, "PUT", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mutateApi(`/api/members/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}
