// 과거 주문 내역 라우트 정의
// Unit 5: 과거 주문 조회 (US-15)
// app.ts에서 '/api/order' prefix로 마운트
// ⚠️ Unit 3의 orderRoutes와 병합 또는 별도 마운트 필요

import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
// ⚠️ requireAdmin은 Unit 1 의존. 현재는 스텁 미들웨어 사용.
import { listHistory } from '../controllers/OrderHistoryController';

const router = Router();

// GET /api/order/history — 과거 주문 내역 조회 (BR-TABLE-05, BR-TABLE-08)
router.get('/history', authenticate, requireAdmin, listHistory);

export default router;
