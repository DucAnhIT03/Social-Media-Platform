import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export type ToastState = {
  open: boolean;
  message: string;
  type: ToastType;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  open: false,
  message: '',
  type: 'info',
  show: (message, type = 'info') => set({ open: true, message, type }),
  hide: () => set({ open: false }),
}));

