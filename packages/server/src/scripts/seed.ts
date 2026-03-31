import mongoose from 'mongoose';
import { config } from '../config';
import { AdminAccount } from '../models/AdminAccount';
import { hashPassword } from '../utils/auth';

// 초기 관리자 계정 생성 스크립트
async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB 연결 성공');

  const storeId = process.argv[2] || 'store1';
  const username = process.argv[3] || 'admin';
  const password = process.argv[4] || 'admin1234';

  const existing = await AdminAccount.findOne({ storeId });
  if (existing) {
    console.log(`이미 존재하는 매장입니다: ${storeId}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await hashPassword(password);
  await AdminAccount.create({ storeId, username, passwordHash });
  console.log(`관리자 계정 생성 완료 - storeId: ${storeId}, username: ${username}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('시드 실패:', err);
  process.exit(1);
});
