import { create } from 'zustand';
import type { CartItem, Order, Menu, Session } from '../types/order';
import { CART_MAX_QUANTITY, CART_STORAGE_KEY } from '../types/order';
import { orderApi } from '../services/orderApi';

interface CustomerStore {
  // 상태
  cart: CartItem[];
  orders: Order[];
  session: Session | null;

  // 장바구니 액션
  addToCart: (menu: Menu) => void;
  removeFromCart: (menuId: string) => void;
  updateQuantity: (menuId: string, qty: number) => void;
  clearCart: () => void;

  // 주문 액션
  createOrder: () => Promise<Order>;
  fetchOrders: () => Promise<void>;

  // 세션
  setSession: (session: Session) => void;
}

/** localStorage에서 장바구니 복원 */
function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** localStorage에 장바구니 저장 */
function saveCartToStorage(cart: CartItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  cart: loadCartFromStorage(),
  orders: [],
  session: null,

  addToCart: (menu: Menu) => {
    set((state) => {
      const existing = state.cart.find((item) => item.menuId === menu._id);
      let newCart: CartItem[];

      if (existing) {
        if (existing.quantity >= CART_MAX_QUANTITY) return state;
        newCart = state.cart.map((item) =>
          item.menuId === menu._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newCart = [
          ...state.cart,
          { menuId: menu._id, menuName: menu.name, unitPrice: menu.price, quantity: 1 },
        ];
      }

      saveCartToStorage(newCart);
      return { cart: newCart };
    });
  },

  removeFromCart: (menuId: string) => {
    set((state) => {
      const newCart = state.cart.filter((item) => item.menuId !== menuId);
      saveCartToStorage(newCart);
      return { cart: newCart };
    });
  },

  updateQuantity: (menuId: string, qty: number) => {
    set((state) => {
      if (qty <= 0) {
        const newCart = state.cart.filter((item) => item.menuId !== menuId);
        saveCartToStorage(newCart);
        return { cart: newCart };
      }

      const clampedQty = Math.min(qty, CART_MAX_QUANTITY);
      const newCart = state.cart.map((item) =>
        item.menuId === menuId ? { ...item, quantity: clampedQty } : item
      );
      saveCartToStorage(newCart);
      return { cart: newCart };
    });
  },

  clearCart: () => {
    localStorage.removeItem(CART_STORAGE_KEY);
    set({ cart: [] });
  },

  createOrder: async () => {
    const { cart, session } = get();
    if (!session) throw new Error('세션 정보가 없습니다.');
    if (cart.length === 0) throw new Error('장바구니가 비어있습니다.');

    const totalAmount = cart.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const order = await orderApi.createOrder({
      storeId: session.storeId,
      tableId: session.tableId,
      sessionId: session.sessionId,
      items: cart.map((item) => ({
        menuName: item.menuName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      totalAmount,
    });

    set((state) => ({ orders: [...state.orders, order] }));
    get().clearCart();
    return order;
  },

  fetchOrders: async () => {
    const { session } = get();
    if (!session) return;

    const orders = await orderApi.listOrders(
      session.storeId,
      session.tableId,
      session.sessionId
    );
    set({ orders });
  },

  setSession: (session: Session) => set({ session }),
}));
