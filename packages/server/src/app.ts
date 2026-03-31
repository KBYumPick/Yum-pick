import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth';

const app = express();

// 미들웨어
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

// 라우트
app.use('/api/auth', authRoutes);
// 다른 유닛의 라우트는 통합 시 여기에 추가
// app.use('/api/menu', menuRoutes);
// app.use('/api/order', orderRoutes);
// app.use('/api/table', tableRoutes);
// app.use('/api/sse', sseRoutes);

// 헬스체크
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
