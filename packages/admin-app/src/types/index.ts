// 주문 상태
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

// 테이블 엔티티
export interface Table {
  _id: string;
  storeId: string;
  tableNumber: number;
  currentSessionId: string | null;
  isActive: boolean;
}

// SSE 이벤트 타입
export type SSEEventType = 'new_order' | 'order_status_updated' | 'order_deleted';

// 주문 삭제 이벤트 페이로드
export interface OrderDeletedPayload {
  orderId: string;
  tableId: string;
}

// 대시보드 뷰 모델 (테이블별 집계)
export interface DashboardView {
  tableId: string;
  tableNumber: number;
  orders: Order[];
  totalAmount: number;
  latestOrder: Order | null;
  hasNewOrder: boolean;
  pendingCount: number;
  preparingCount: number;
}

// 상태 전이 맵
export const VALID_TRANSITIONS: Record<string, OrderStatus> = {
  pending: 'preparing',
  preparing: 'completed',
};

// 다음 상태 라벨
export const NEXT_STATUS_LABEL: Record<string, string> = {
  pending: '준비중으로 변경',
  preparing: '완료로 변경',
};
