import { create } from 'zustand';

interface AdminAuthState {
  token: string | null;
  storeId: string | null;
  isAuthenticated: boolean;
  setAuth: (data: { token: string; storeId: string }) => void;
  clearAuth: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  token: null,
  storeId: null,
  isAuthenticated: false,
  setAuth: (data) => set({ ...data, isAuthenticated: true }),
  clearAuth: () => set({ token: null, storeId: null, isAuthenticated: false }),
}));
