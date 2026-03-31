import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AdminAccount } from '../models/AdminAccount';
import {
  comparePassword,
  generateToken,
  checkLoginAttempts,
  recordLoginFailure,
  recordLoginSuccess,
  TOKEN_EXPIRY_IN_SECONDS,
} from '../utils/auth';
import { AdminLoginRequest, TableLoginRequest } from '../types/auth';

// NOTE: TableModel은 Unit 5 (준형)에서 생성 예정
// 임시로 mongoose를 직접 사용하여 tables 컬렉션 조회
import mongoose from 'mongoose';

// POST /api/auth/admin/login - 관리자 로그인
export async function adminLogin(req: Request, res: Response): Promise<void> {
  const { storeId, username, password } = req.body as AdminLoginRequest;

  if (!storeId || !username || !password) {
    res.status(400).json({ error: '매장 식별자, 사용자명, 비밀번호를 모두 입력해주세요.' });
    return;
  }

  const attemptKey = `${storeId}:${username}`;

  // BR-AUTH-03: 로그인 시도 제한 확인
  const attemptCheck = checkLoginAttempts(attemptKey);
  if (!attemptCheck.allowed) {
    res.status(429).json({
      error: `계정이 잠겼습니다. ${attemptCheck.remainingMinutes}분 후 다시 시도해주세요.`,
    });
    return;
  }

  // BR-AUTH-08: storeId + username 검증
  const admin = await AdminAccount.findOne({ storeId, username });
  if (!admin) {
    recordLoginFailure(attemptKey);
    res.status(401).json({ error: '인증에 실패했습니다.' });
    return;
  }

  // BR-AUTH-02: 비밀번호 비교
  const isMatch = await comparePassword(password, admin.passwordHash);
  if (!isMatch) {
    recordLoginFailure(attemptKey);
    res.status(401).json({ error: '인증에 실패했습니다.' });
    return;
  }

  // BR-AUTH-01: JWT 생성 (16시간)
  const token = generateToken({ id: admin.storeId, role: 'admin', storeId: admin.storeId });
  recordLoginSuccess(attemptKey);

  res.json({ token, expiresIn: TOKEN_EXPIRY_IN_SECONDS });
}

// POST /api/auth/table/login - 테이블 로그인
export async function tableLogin(req: Request, res: Response): Promise<void> {
  const { storeId, tableNumber, password } = req.body as TableLoginRequest;

  if (!storeId || tableNumber == null || !password) {
    res.status(400).json({ error: '매장 식별자, 테이블 번호, 비밀번호를 모두 입력해주세요.' });
    return;
  }

  const attemptKey = `${storeId}:table${tableNumber}`;

  // BR-AUTH-04: 로그인 시도 제한 확인
  const attemptCheck = checkLoginAttempts(attemptKey);
  if (!attemptCheck.allowed) {
    res.status(429).json({
      error: `계정이 잠겼습니다. ${attemptCheck.remainingMinutes}분 후 다시 시도해주세요.`,
    });
    return;
  }

  // BR-AUTH-08: storeId + tableNumber 검증
  const table = await mongoose.connection.db
    .collection('tables')
    .findOne({ storeId, tableNumber });

  if (!table) {
    recordLoginFailure(attemptKey);
    res.status(401).json({ error: '인증에 실패했습니다.' });
    return;
  }

  // BR-AUTH-02: 비밀번호 비교
  const isMatch = await comparePassword(password, table.passwordHash);
  if (!isMatch) {
    recordLoginFailure(attemptKey);
    res.status(401).json({ error: '인증에 실패했습니다.' });
    return;
  }

  // BR-AUTH-06: 새 sessionId 생성
  const sessionId = uuidv4();

  // 테이블 세션 업데이트
  await mongoose.connection.db.collection('tables').updateOne(
    { _id: table._id },
    {
      $set: {
        currentSessionId: sessionId,
        sessionStartedAt: new Date(),
        isActive: true,
      },
    },
  );

  // BR-AUTH-01: JWT 생성 (16시간)
  const token = generateToken({
    id: table._id.toString(),
    role: 'table',
    storeId,
    sessionId,
  });
  recordLoginSuccess(attemptKey);

  res.json({ token, sessionId, expiresIn: TOKEN_EXPIRY_IN_SECONDS });
}

// GET /api/auth/verify - 토큰 검증
export function verifyTokenEndpoint(req: Request, res: Response): void {
  // authenticate 미들웨어가 이미 토큰을 검증하고 req.user에 설정
  const user = req.user!;
  res.json({ valid: true, role: user.role, storeId: user.storeId });
}
