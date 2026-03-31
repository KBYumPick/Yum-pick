import mongoose from 'mongoose';
import { OrderStatus, ORDER_STATUS_TRANSITIONS } from '../types/order.types.js';

const orderItemSchema = new mongoose.Schema(
  {
    menuName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true },
    tableId: { type: String, required: true },
    sessionId: { type: String, required: true },
    orderNumber: { type: String, required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: '주문 항목이 비어있습니다.',
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
  },
  { timestamps: true }
);

// 인덱스
orderSchema.index({ storeId: 1, sessionId: 1 });
orderSchema.index({ storeId: 1, tableId: 1, createdAt: -1 });
orderSchema.index({ storeId: 1, orderNumber: 1 }, { unique: true });

/**
 * 주문 번호 생성 (YYYYMMDD-NNN)
 * @param {string} storeId
 * @returns {Promise<string>}
 */
orderSchema.statics.generateOrderNumber = async function (storeId) {
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

/**
 * 상태 전이 검증 (단방향만 허용)
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
orderSchema.statics.isValidTransition = function (currentStatus, newStatus) {
  return ORDER_STATUS_TRANSITIONS[currentStatus] === newStatus;
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
