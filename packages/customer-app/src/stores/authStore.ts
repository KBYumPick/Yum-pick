import { create } from 'zustand';

interface AuthState {
  token: string | null;
  sessionId: string | null;
  storeId: string | null;
  tableNumber: number | null;
  isAuthenticated: boolean;
  setAuth: (data: { token: string; sessionId: string; storeId: string; tableNumber: number }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  sessionId: null,
  storeId: null,
  tableNumber: null,
  isAuthenticated: false,
  setAuth: (data) => set({ ...data, isAuthenticated: true }),
  clearAuth: () =>
    set({ token: null, sessionId: null, storeId: null, tableNumber: null, isAuthenticated: false }),
}));
