import mongoose from 'mongoose';
import { config } from './config';
import app from './app';

async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB 연결 성공');

    app.listen(config.port, () => {
      console.log(`서버 시작: http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

start();
