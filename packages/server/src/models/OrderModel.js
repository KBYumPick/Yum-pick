const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true, index: true },
    tableId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },
    orderNumber: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'preparing', 'completed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// storeId + status 복합 인덱스 (대시보드 조회 최적화)
orderSchema.index({ storeId: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
