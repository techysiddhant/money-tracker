import { create } from "zustand";

export interface SplitRow {
  tempId: string;
  memberId: string;
  amount: number;
  received: number;
  confirmed: boolean;
}

interface ExpenseFormState {
  // Split rows
  splits: SplitRow[];
  addSplitRow: () => void;
  updateSplit: (tempId: string, field: keyof SplitRow, value: unknown) => void;
  removeSplit: (tempId: string) => void;
  confirmSplit: (tempId: string) => void;
  autoSplit: (totalAmount: number) => void;
  setSplits: (splits: SplitRow[]) => void;
  resetSplits: () => void;

  // Delete dialog
  deleteOpen: boolean;
  deletingId: string | null;
  openDelete: (id: string) => void;
  closeDelete: () => void;
}

export const useExpenseFormStore = create<ExpenseFormState>((set, get) => ({
  // Split rows
  splits: [],

  addSplitRow: () =>
    set((state) => ({
      splits: [
        ...state.splits,
        {
          tempId: crypto.randomUUID(),
          memberId: "",
          amount: 0,
          received: 0,
          confirmed: false,
        },
      ],
    })),

  updateSplit: (tempId, field, value) =>
    set((state) => ({
      splits: state.splits.map((s) =>
        s.tempId === tempId ? { ...s, [field]: value } : s
      ),
    })),

  removeSplit: (tempId) =>
    set((state) => ({
      splits: state.splits.filter((s) => s.tempId !== tempId),
    })),

  confirmSplit: (tempId) =>
    set((state) => ({
      splits: state.splits.map((s) =>
        s.tempId === tempId ? { ...s, confirmed: true } : s
      ),
    })),

  autoSplit: (totalAmount) => {
    const { splits } = get();
    if (!totalAmount || splits.length === 0) return;

    const splitAmount = Math.round((totalAmount / splits.length) * 100) / 100;
    const remainder =
      Math.round((totalAmount - splitAmount * splits.length) * 100) / 100;

    set({
      splits: splits.map((s, i) => ({
        ...s,
        amount: i === 0 ? splitAmount + remainder : splitAmount,
        confirmed: true,
      })),
    });
  },

  setSplits: (splits) => set({ splits }),
  resetSplits: () => set({ splits: [] }),

  // Delete dialog
  deleteOpen: false,
  deletingId: null,
  openDelete: (id) => set({ deleteOpen: true, deletingId: id }),
  closeDelete: () => set({ deleteOpen: false, deletingId: null }),
}));
