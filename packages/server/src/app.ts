import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth';
import menuRoutes from './routes/menuRoutes';
import orderHistoryRoutes from './routes/orderHistoryRoutes';
import tableRoutes from './routes/tableRoutes';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const orderRoutes = require('./routes/orderRoutes');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sseRoutes = require('./routes/sseRoutes');

const app = express();

// 미들웨어
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/order-history', orderHistoryRoutes);
app.use('/api/table', tableRoutes);
app.use('/api/sse', sseRoutes);

// 헬스체크
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
