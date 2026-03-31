// 주문 상태 타입
export type OrderStatus = 'pending' | 'preparing' | 'completed';

// 주문 아이템
export interface OrderItem {
  menuName: string;
  quantity: number;
  unitPrice: number;
}

// 주문 엔티티
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

// SSE 이벤트 타입
export type SSEEventType = 'new_order' | 'order_status_updated' | 'order_deleted';

// 주문 삭제 이벤트 페이로드
export interface OrderDeletedPayload {
  orderId: string;
  tableId: string;
}

// SSE 이벤트
export interface SSEEvent {
  event: SSEEventType;
  data: Order | OrderDeletedPayload;
}

// 상태 전이 유효성 맵
export const VALID_TRANSITIONS: Record<string, OrderStatus> = {
  pending: 'preparing',
  preparing: 'completed',
};
