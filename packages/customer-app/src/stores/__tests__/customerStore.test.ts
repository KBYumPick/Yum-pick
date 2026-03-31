import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCustomerStore } from '../customerStore';
import type { Menu } from '../../types/order';
import { CART_MAX_QUANTITY, CART_STORAGE_KEY } from '../../types/order';

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockMenu: Menu = {
  _id: 'menu1',
  name: '김치찌개',
  price: 8000,
  category: '찌개',
};

const mockMenu2: Menu = {
  _id: 'menu2',
  name: '된장찌개',
  price: 7000,
  category: '찌개',
};

describe('CustomerStore - Cart', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useCustomerStore.setState({ cart: [], orders: [], session: null });
  });

  it('addToCart: 새 메뉴를 장바구니에 추가한다', () => {
    useCustomerStore.getState().addToCart(mockMenu);
    const cart = useCustomerStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].menuId).toBe('menu1');
    expect(cart[0].quantity).toBe(1);
    expect(cart[0].unitPrice).toBe(8000);
  });

  it('addToCart: 동일 메뉴 추가 시 수량 +1 (BR-CART-03)', () => {
    useCustomerStore.getState().addToCart(mockMenu);
    useCustomerStore.getState().addToCart(mockMenu);
    const cart = useCustomerStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it('addToCart: 수량 99에서 추가 시 변경 없음 (BR-CART-01)', () => {
    useCustomerStore.setState({
      cart: [{ menuId: 'menu1', menuName: '김치찌개', unitPrice: 8000, quantity: CART_MAX_QUANTITY }],
    });
    useCustomerStore.getState().addToCart(mockMenu);
    expect(useCustomerStore.getState().cart[0].quantity).toBe(CART_MAX_QUANTITY);
  });

  it('updateQuantity: 수량 변경', () => {
    useCustomerStore.getState().addToCart(mockMenu);
    useCustomerStore.getState().updateQuantity('menu1', 5);
    expect(useCustomerStore.getState().cart[0].quantity).toBe(5);
  });

  it('updateQuantity: 0 이하 시 항목 삭제 (BR-CART-02)', () => {
    useCustomerStore.getState().addToCart(mockMenu);
    useCustomerStore.getState().updateQuantity('menu1', 0);
    expect(useCustomerStore.getState().cart).toHaveLength(0);
  });

  it('updateQuantity: 99 초과 시 99로 클램핑 (BR-CART-01)', () => {
    useCustomerStore.getState().addToCart(mockMenu);
    useCustomerStore.getState().updateQuantity('menu1', 150);
    expect(useCustomerStore.getState().cart[0].quantity).toBe(CART_MAX_QUANTITY);
  });

  it('removeFromCart: 항목 삭제', () => {
    useCustomerStore.getState().addToCart(mockMenu);
    useCustomerStore.getState().addToCart(mockMenu2);
    useCustomerStore.getState().removeFromCart('menu1');
    const cart = useCustomerStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].menuId).toBe('menu2');
  });

  it('clearCart: 장바구니 비우기 (BR-CART-05)', () => {
    useCustomerStore.getState().addToCart(mockMenu);
    useCustomerStore.getState().addToCart(mockMenu2);
    useCustomerStore.getState().clearCart();
    expect(useCustomerStore.getState().cart).toHaveLength(0);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(CART_STORAGE_KEY);
  });

  it('localStorage에 장바구니 상태가 동기화된다 (BR-CART-04)', () => {
    useCustomerStore.getState().addToCart(mockMenu);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      CART_STORAGE_KEY,
      expect.any(String)
    );
  });
});
