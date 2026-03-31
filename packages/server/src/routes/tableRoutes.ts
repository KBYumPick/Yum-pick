// 테이블 라우트 정의
// Unit 5: 테이블 CRUD + 세션 종료 (US-13, US-14)
// app.ts에서 '/api/table' prefix로 마운트

import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
// ⚠️ requireAdmin은 Unit 1 의존. 현재는 스텁 미들웨어 사용.
// Unit 1 완성 시 실제 JWT 검증 미들웨어로 자동 교체됩니다.
import {
  listTables,
  createTable,
  updateTable,
  deleteTable,
  endSession,
} from '../controllers/TableController';

const router = Router();

// GET /api/table/list — 테이블 목록 조회 (BR-TABLE-07, BR-TABLE-08)
router.get('/list', authenticate, requireAdmin, listTables);

// POST /api/table/create — 테이블 등록 (BR-TABLE-01, BR-TABLE-02)
router.post('/create', authenticate, requireAdmin, createTable);

// PUT /api/table/update/:id — 테이블 수정 (BR-TABLE-01, BR-TABLE-06, BR-TABLE-08)
router.put('/update/:id', authenticate, requireAdmin, updateTable);

// DELETE /api/table/delete/:id — 테이블 삭제 (BR-TABLE-04, BR-TABLE-08)
router.delete('/delete/:id', authenticate, requireAdmin, deleteTable);

// POST /api/table/end-session/:id — 세션 종료 (BR-TABLE-03, BR-TABLE-08)
router.post('/end-session/:id', authenticate, requireAdmin, endSession);

export default router;
