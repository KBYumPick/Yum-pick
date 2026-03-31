/**
 * AdminStore - 관리자앱 전역 상태 관리 (Zustand)
 *
 * 통합 가이드:
 * - Unit4 (덕인): orders, SSE 이벤트 핸들러, dashboardView ✅
 * - Unit1 (채원): auth (login/logout) 추가 시 AdminState에 login/logout 액션 추가
 * - Unit2 (지승): menus (fetchMenus, createMenu, updateMenu, deleteMenu) 추가
 * - Unit5 (준형): tables (fetchTables, endTableSession) 추가
 *
 * 각 유닛 담당자는 AdminState 인터페이스에 자신의 상태/액션을 추가하고
 * create() 내부에 구현을 추가하면 됩니다.
 */
import { create } from 'zustand';
import type { Order, Table, DashboardView } from '../types';
import { api } from '../services/api';

interface AdminState {
  // 인증
  auth: { token: string | null; storeId: string | null };

  // 데이터
  orders: Order[];
  tables: Table[];
  isLoading: boolean;
  error: string | null;

  // 대시보드
  selectedTableId: string | null;
  newOrderTableIds: Set<string>; // 신규 주문 강조 플래그

  // 액션
  fetchOrders: () => Promise<void>;
  fetchTables: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;

  // SSE 이벤트 수신용 내부 액션
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  removeOrder: (orderId: string) => void;
  setNewOrderFlag: (tableId: string, value: boolean) => void;
  setSelectedTableId: (tableId: string | null) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  auth: {
    token: localStorage.getItem('admin_token'),
    storeId: localStorage.getItem('admin_storeId'),
  },
  orders: [],
  tables: [],
  isLoading: false,
  error: null,
  selectedTableId: null,
  newOrderTableIds: new Set(),

  async fetchOrders() {
    const { storeId } = get().auth;
    if (!storeId) return;
    set({ isLoading: true, error: null });
    try {
      const orders = await api.fetchOrders(storeId);
      set({ orders, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  async fetchTables() {
    const { storeId } = get().auth;
    if (!storeId) return;
    try {
      const tables = await api.fetchTables(storeId);
      set({ tables });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  async updateOrderStatus(orderId, status) {
    try {
      await api.updateOrderStatus(orderId, status);
      // SSE로 업데이트가 올 것이므로 낙관적 업데이트는 생략 가능
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  async deleteOrder(orderId) {
    try {
      await api.deleteOrder(orderId);
      // SSE로 삭제 이벤트가 올 것이므로 낙관적 업데이트는 생략 가능
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  // SSE 이벤트 핸들러
  addOrder(order) {
    set((state) => ({
      orders: [...state.orders, order],
    }));
  },

  updateOrder(order) {
    set((state) => ({
      orders: state.orders.map((o) => (o._id === order._id ? order : o)),
    }));
  },

  removeOrder(orderId) {
    set((state) => ({
      orders: state.orders.filter((o) => o._id !== orderId),
    }));
  },

  setNewOrderFlag(tableId, value) {
    set((state) => {
      const next = new Set(state.newOrderTableIds);
      if (value) {
        next.add(tableId);
      } else {
        next.delete(tableId);
      }
      return { newOrderTableIds: next };
    });
  },

  setSelectedTableId(tableId) {
    set({ selectedTableId: tableId });
  },
}));

/**
 * 대시보드 뷰 계산 (selector)
 */
export function computeDashboardViews(
  orders: Order[],
  tables: Table[],
  newOrderTableIds: Set<string>
): DashboardView[] {
  // tableId별 주문 그룹핑
  const grouped = new Map<string, Order[]>();
  for (const order of orders) {
    const list = grouped.get(order.tableId) ?? [];
    list.push(order);
    grouped.set(order.tableId, list);
  }

  const views: DashboardView[] = tables.map((table) => {
    const tableOrders = grouped.get(table._id) ?? [];
    const sorted = [...tableOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      tableId: table._id,
      tableNumber: table.tableNumber,
      orders: tableOrders,
      totalAmount: tableOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      latestOrder: sorted[0] ?? null,
      hasNewOrder: newOrderTableIds.has(table._id),
      pendingCount: tableOrders.filter((o) => o.status === 'pending').length,
      preparingCount: tableOrders.filter((o) => o.status === 'preparing').length,
    };
  });

  // tableNumber 오름차순 정렬
  views.sort((a, b) => a.tableNumber - b.tableNumber);
  return views;
}
