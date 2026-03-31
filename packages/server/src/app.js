const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Unit3: 주문 생성/조회 (유진)
const orderRoutes = require('./routes/orderRoutes');
app.use('/api/order', orderRoutes);

// Unit4: 주문 모니터링 (덕인)
const sseRoutes = require('./routes/sseRoutes');
app.use('/api/sse', sseRoutes);

// 헬스체크
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 에러 핸들링 미들웨어
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

module.exports = app;
