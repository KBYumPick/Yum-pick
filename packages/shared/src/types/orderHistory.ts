// 과거 주문 내역 관련 타입 정의

/** 주문 항목 */
export interface IOrderHistoryItem {
  menuName: string;
  quantity: number;
  unitPrice: number;
}

/** 과거 주문 내역 */
export interface IOrderHistory {
  _id: string;
  storeId: string;
  tableId: string;
  sessionId: string;
  orderNumber: string;
  items: IOrderHistoryItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'completed';
  createdAt: string;
}

/** 과거 주문 조회 쿼리 */
export interface IOrderHistoryQuery {
  storeId: string;
  tableId: string;
  date?: string;
}
