const Order = require('../models/OrderModel');
const sseService = require('../services/SSEService');

// 유효 상태 전이 맵
const VALID_TRANSITIONS = {
  pending: 'preparing',
  preparing: 'completed',
};

/**
 * OrderController - 주문 상태 변경 및 삭제 (Unit4 담당 범위)
 */
const OrderController = {
  /**
   * 주문 상태 변경 - PUT /api/order/status/:id
   * body: { status }
   * JWT 인증 필수 (role: admin)
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // 1. 주문 조회
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
      }

      // 2. storeId 검증 (보안상 404 반환)
      if (order.storeId !== req.user.storeId) {
        return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
      }

      // 3. 상태 전이 유효성 검증
      if (VALID_TRANSITIONS[order.status] !== status) {
        return res.status(400).json({
          message: `유효하지 않은 상태 전이입니다. (현재: ${order.status}, 요청: ${status})`,
        });
      }

      // 4. 상태 업데이트
      order.status = status;
      order.updatedAt = new Date();
      const updatedOrder = await order.save();

      // 5. SSE 브로드캐스트
      sseService.broadcast(order.storeId, {
        event: 'order_status_updated',
        data: updatedOrder,
      });

      // 6. 응답
      return res.json(updatedOrder);
    } catch (error) {
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  /**
   * 주문 삭제 - DELETE /api/order/delete/:id
   * JWT 인증 필수 (role: admin)
   */
  async deleteOrder(req, res) {
    try {
      const { id } = req.params;

      // 1. 주문 조회
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
      }

      // 2. storeId 검증 (보안상 404 반환)
      if (order.storeId !== req.user.storeId) {
        return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
      }

      // 3. 삭제 (hard delete)
      await Order.findByIdAndDelete(id);

      // 4. SSE 브로드캐스트
      sseService.broadcast(order.storeId, {
        event: 'order_deleted',
        data: { orderId: id, tableId: order.tableId },
      });

      // 5. 응답
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
};

module.exports = OrderController;
