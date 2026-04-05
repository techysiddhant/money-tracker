import { create } from "zustand";

interface ExpenseFilters {
  cycleId?: string;
  categoryId?: string;
  paymentMethodId?: string;
  memberId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface ExpenseFiltersState {
  filters: ExpenseFilters;
  page: number;
  updateFilter: (key: keyof ExpenseFilters, value: string | undefined) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
}

export const useExpenseFiltersStore = create<ExpenseFiltersState>((set) => ({
  filters: {},
  page: 1,
  updateFilter: (key, value) =>
    set((state) => ({
      page: 1,
      filters: {
        ...state.filters,
        [key]: value === "all" || value === "" ? undefined : value,
      },
    })),
  resetFilters: () => set({ filters: {}, page: 1 }),
  setPage: (page) => set({ page }),
}));
