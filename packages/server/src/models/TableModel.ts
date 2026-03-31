// 테이블 Mongoose 모델 정의
// Unit 5: 테이블 관리

import mongoose, { Document, Schema } from 'mongoose';

/** 테이블 도큐먼트 인터페이스 */
export interface ITableDocument extends Document {
  storeId: string;
  tableNumber: number;
  password: string;
  currentSessionId: string | null;
  sessionStartedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** 테이블 스키마 정의 */
const tableSchema = new Schema<ITableDocument>(
  {
    // 매장 식별자
    storeId: {
      type: String,
      required: true,
      index: true,
    },
    // 테이블 번호 (동일 매장 내 고유)
    tableNumber: {
      type: Number,
      required: true,
    },
    // bcrypt 해싱된 비밀번호 (BR-TABLE-02)
    password: {
      type: String,
      required: true,
    },
    // 현재 활성 세션 ID (없으면 null)
    currentSessionId: {
      type: String,
      default: null,
    },
    // 세션 시작 시각 (없으면 null)
    sessionStartedAt: {
      type: Date,
      default: null,
    },
    // 세션 활성 여부 (true: 이용 중, false: 비어 있음)
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
  }
);

// BR-TABLE-01: 동일 매장 내 테이블 번호 중복 방지 복합 유니크 인덱스
tableSchema.index({ storeId: 1, tableNumber: 1 }, { unique: true });

// BR-TABLE-02: API 응답 시 password, __v 필드 자동 제거
tableSchema.set('toJSON', {
  transform(_doc: Document, ret: Record<string, unknown>) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const TableModel = mongoose.model<ITableDocument>('Table', tableSchema);

export default TableModel;
