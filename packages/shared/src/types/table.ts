// 테이블 관련 타입 정의

/** 테이블 API 응답 인터페이스 (password 제외) */
export interface ITable {
  _id: string;
  storeId: string;
  tableNumber: number;
  currentSessionId: string | null;
  sessionStartedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** duckin 브랜치의 Table 타입 (ITable alias) */
export type Table = ITable;

/** 테이블 생성 요청 */
export interface ICreateTableRequest {
  storeId: string;
  tableNumber: number;
  password: string;
}

/** 테이블 수정 요청 */
export interface IUpdateTableRequest {
  tableNumber?: number;
  password?: string;
}

/** 테이블 폼 데이터 */
export interface ITableFormData {
  tableNumber: number;
  password: string;
}
