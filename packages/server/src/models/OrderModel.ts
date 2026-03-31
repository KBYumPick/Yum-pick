// 주문 Mongoose 모델 (스텁)
// ⚠️ Unit 5 스텁: Unit 3 (장바구니/주문) 완성 시 이 파일은 대체됩니다.
// Unit 3에서 전체 주문 스키마 및 비즈니스 로직을 구현합니다.
// 이 스텁은 Unit 5의 과거 주문 조회(GET /api/order/history)를 지원하기 위한
// 최소한의 스키마만 포함합니다.

import mongoose, { Document, Schema } from 'mongoose';

/** 주문 항목 인터페이스 */
export interface IOrderItem {
  menuName: string;
  quantity: number;
  unitPrice: number;
}

/** 주문 도큐먼트 인터페이스 */
export interface IOrderDocument extends Document {
  storeId: string;
  tableId: string;
  sessionId: string;
  orderNumber: string;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

/** 주문 항목 서브 스키마 */
const orderItemSchema = new Schema<IOrderItem>(
  {
    menuName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
  },
  { _id: false }
);

/** 주문 스키마 (스텁 — 과거 주문 조회 지원용 최소 스키마) */
const orderSchema = new Schema<IOrderDocument>(
  {
    storeId: { type: String, required: true, index: true },
    tableId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// 주문 번호 생성 (YYYYMMDD-NNN)
orderSchema.statics.generateOrderNumber = async function (storeId: string): Promise<string> {
  const now = new Date();
  const dateStr =
    String(now.getFullYear()) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');

  const lastOrder = await this.findOne(
    { storeId, orderNumber: { $regex: `^${dateStr}-` } },
    { orderNumber: 1 },
    { sort: { orderNumber: -1 } }
  );

  const seq = lastOrder
    ? parseInt(lastOrder.orderNumber.split('-')[1], 10) + 1
    : 1;

  return `${dateStr}-${String(seq).padStart(3, '0')}`;
};

interface OrderModelType extends mongoose.Model<IOrderDocument> {
  generateOrderNumber(storeId: string): Promise<string>;
}

const OrderModel = mongoose.model<IOrderDocument>('Order', orderSchema) as OrderModelType;

export default OrderModel;
