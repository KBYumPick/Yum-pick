import { Router } from 'express';
import { createOrder, listOrders, getOrder } from '../controllers/orderController.js';

const router = Router();

// POST /api/order/create - 주문 생성 (US-07)
router.post('/create', createOrder);

// GET /api/order/list - 주문 목록 조회 (US-08)
router.get('/list', listOrders);

// GET /api/order/detail/:id - 주문 상세 조회 (US-08)
router.get('/detail/:id', getOrder);

export default router;
