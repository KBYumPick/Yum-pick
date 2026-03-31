// 테이블 엔티티
export interface Table {
  _id: string;
  storeId: string;
  tableNumber: number;
  currentSessionId: string | null;
  sessionStartedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
