const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

/**
 * ============================================
 * 라우트 조립 (각 유닛 담당자가 자신의 route 파일 작성)
 * ============================================
 *
 * Unit1 (채원): 인증
 *   - /api/auth → routes/authRoutes.js
 *
 * Unit2 (지승): 메뉴
 *   - /api/menu → routes/menuRoutes.js
 *
 * Unit3 (유진): 주문 생성/조회
 *   - /api/order (create, list, detail) → routes/orderCreateRoutes.js
 *
 * Unit4 (덕인): 주문 모니터링 ✅ 구현 완료
 *   - /api/order (status, delete) → routes/orderRoutes.js
 *   - /api/sse → routes/sseRoutes.js
 *
 * Unit5 (준형): 테이블 관리
 *   - /api/table → routes/tableRoutes.js
 */

// ── Unit1: 인증 (채원) ──
// TODO: 채원이 authRoutes.js 작성 후 아래 주석 해제
// const authRoutes = require('./routes/authRoutes');
// app.use('/api/auth', authRoutes);

// ── Unit2: 메뉴 (지승) ──
// TODO: 지승이 menuRoutes.js 작성 후 아래 주석 해제
// const menuRoutes = require('./routes/menuRoutes');
// app.use('/api/menu', menuRoutes);

// ── Unit3: 주문 생성/조회 (유진) ──
// TODO: 유진이 orderCreateRoutes.js 작성 후 아래 주석 해제
// const orderCreateRoutes = require('./routes/orderCreateRoutes');
// app.use('/api/order', orderCreateRoutes);

// ── Unit4: 주문 모니터링 (덕인) ✅ ──
const orderRoutes = require('./routes/orderRoutes');
const sseRoutes = require('./routes/sseRoutes');
app.use('/api/order', orderRoutes);
app.use('/api/sse', sseRoutes);

// ── Unit5: 테이블 관리 (준형) ──
// TODO: 준형이 tableRoutes.js 작성 후 아래 주석 해제
// const tableRoutes = require('./routes/tableRoutes');
// app.use('/api/table', tableRoutes);

// 에러 핸들링 미들웨어
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

module.exports = app;
