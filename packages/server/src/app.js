import express from 'express';
import cors from 'cors';
import orderRoutes from './routes/orderRoutes.js';

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우트
// app.use('/api/auth', authRoutes);   // Unit 1
// app.use('/api/menu', menuRoutes);   // Unit 2
app.use('/api/order', orderRoutes);    // Unit 3
// app.use('/api/table', tableRoutes); // Unit 5
// app.use('/api/sse', sseRoutes);     // Unit 4

// 헬스체크
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 에러 핸들러
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

export default app;
