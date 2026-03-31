/** 장바구니 항목 (클라이언트 전용, localStorage 저장) */
export interface CartItem {
  menuId: string;
  menuName: string;
  unitPrice: number;
  quantity: number;
}

/** 주문 항목 (Order 내 서브도큐먼트) */
export interface OrderItem {
  menuName: string;
  quantity: number;
  unitPrice: number;
}

/** 주문 상태 */
export type OrderStatus = 'pending' | 'preparing' | 'completed';

/** 주문 */
export interface Order {
  _id: string;
  storeId: string;
  tableId: string;
  sessionId: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

/** 메뉴 (장바구니 추가 시 참조) */
export interface Menu {
  _id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  imageUrl?: string;
}

/** 세션 정보 */
export interface Session {
  token: string;
  sessionId: string;
  tableId: string;
  storeId: string;
}

/** 주문 생성 요청 페이로드 */
export interface CreateOrderPayload {
  storeId: string;
  tableId: string;
  sessionId: string;
  items: OrderItem[];
  totalAmount: number;
}

export const CART_MAX_QUANTITY = 99;
export const CART_MIN_QUANTITY = 1;
export const CART_STORAGE_KEY = 'yumpick_cart';
