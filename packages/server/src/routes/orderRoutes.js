const express = require('express');
const { createOrder, listOrders, getOrder } = require('../controllers/orderController');

const router = express.Router();

// Unit3: 주문 생성/조회
// POST /api/order/create - 주문 생성 (US-07)
router.post('/create', createOrder);

// GET /api/order/list - 주문 목록 조회 (US-08)
router.get('/list', listOrders);

// GET /api/order/detail/:id - 주문 상세 조회 (US-08)
router.get('/detail/:id', getOrder);

// Unit4: 주문 상태 변경/삭제 (덕인)
// 아래는 Unit4 컨트롤러가 CommonJS로 전환되면 활성화
// const OrderController = require('../controllers/OrderController');
// router.put('/status/:id', OrderController.updateStatus);
// router.delete('/delete/:id', OrderController.deleteOrder);

module.exports = router;
