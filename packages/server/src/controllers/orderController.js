const OrderModel = require('../models/OrderModel').default;
const { CART_MIN_QUANTITY, CART_MAX_QUANTITY } = require('../types/order.types');

/**
 * 주문 생성
 * POST /api/order/create
 */
async function createOrder(req, res) {
  try {
    const { storeId, tableId, sessionId, items, totalAmount } = req.body;

    // 세션 검증 (BR-ORDER-04)
    if (req.user && req.user.sessionId !== sessionId) {
      return res.status(401).json({ error: '세션이 일치하지 않습니다.' });
    }

    // 빈 주문 검증 (BR-ORDER-01)
    if (!items || items.length === 0) {
      return res.status(400).json({ error: '주문 항목이 비어있습니다.' });
    }

    // 각 항목 수량 검증 (BR-ORDER-03)
    for (const item of items) {
      if (item.quantity < CART_MIN_QUANTITY || item.quantity > CART_MAX_QUANTITY) {
        return res
          .status(400)
          .json({ error: `수량은 ${CART_MIN_QUANTITY}~${CART_MAX_QUANTITY} 범위여야 합니다.` });
      }
    }

    // totalAmount 서버 재계산 및 검증 (BR-ORDER-02)
    const serverTotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    if (serverTotal !== totalAmount) {
      return res.status(400).json({ error: '총 금액이 일치하지 않습니다.' });
    }

    // 주문 번호 생성
    const orderNumber = await OrderModel.generateOrderNumber(storeId);

    const order = await OrderModel.create({
      storeId,
      tableId,
      sessionId,
      orderNumber,
      items,
      totalAmount: serverTotal,
      status: 'pending',
    });

    return res.status(201).json(order);
  } catch (error) {
    // unique 인덱스 중복 시 재시도
    if (error.code === 11000) {
      try {
        const orderNumber = await OrderModel.generateOrderNumber(req.body.storeId);
        const order = await OrderModel.create({
          ...req.body,
          orderNumber,
          status: 'pending',
        });
        return res.status(201).json(order);
      } catch (retryError) {
        return res.status(500).json({ error: '주문 생성에 실패했습니다.' });
      }
    }
    return res.status(500).json({ error: '주문 생성에 실패했습니다.' });
  }
}

/**
 * 주문 목록 조회
 * GET /api/order/list?storeId=&tableId=&sessionId=&status=
 */
async function listOrders(req, res) {
  try {
    const { storeId, tableId, sessionId, status } = req.query;

    const filter = {};
    if (storeId) filter.storeId = storeId;
    if (tableId) filter.tableId = tableId;
    if (sessionId) filter.sessionId = sessionId;
    if (status) filter.status = status;

    const orders = await OrderModel.find(filter).sort({ createdAt: 1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: '주문 목록 조회에 실패했습니다.' });
  }
}

/**
 * 주문 상세 조회
 * GET /api/order/detail/:id
 */
async function getOrder(req, res) {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
    }

    // storeId 검증 (보안상 403 대신 404)
    if (req.user && order.storeId !== req.user.storeId) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: '주문 조회에 실패했습니다.' });
  }
}

module.exports = { createOrder, listOrders, getOrder };
