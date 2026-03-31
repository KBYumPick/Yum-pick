import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload, LoginAttemptRecord } from '../types/auth';
import { config } from '../config';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '16h';
const TOKEN_EXPIRY_SECONDS = 57600;
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15분

// 인메모리 로그인 시도 기록 (BR-AUTH-03, BR-AUTH-04)
const loginAttempts = new Map<string, LoginAttemptRecord>();

// BR-AUTH-02: 비밀번호 해싱
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// BR-AUTH-02: 비밀번호 비교
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// BR-AUTH-01: JWT 생성 (16시간 만료)
export function generateToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: TOKEN_EXPIRY });
}

// JWT 검증
export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}

export const TOKEN_EXPIRY_IN_SECONDS = TOKEN_EXPIRY_SECONDS;

// BR-AUTH-03, BR-AUTH-04: 로그인 시도 제한 확인
export function checkLoginAttempts(key: string): { allowed: boolean; remainingMinutes?: number } {
  const record = loginAttempts.get(key);
  if (!record) return { allowed: true };

  // 잠금 상태 확인
  if (record.lockedUntil) {
    if (record.lockedUntil > new Date()) {
      const remaining = Math.ceil((record.lockedUntil.getTime() - Date.now()) / 60000);
      return { allowed: false, remainingMinutes: remaining };
    }
    // 잠금 해제 - 초기화
    loginAttempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

// 로그인 실패 기록
export function recordLoginFailure(key: string): void {
  const record = loginAttempts.get(key) ?? { count: 0, lockedUntil: null };
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }
  loginAttempts.set(key, record);
}

// 로그인 성공 시 초기화
export function recordLoginSuccess(key: string): void {
  loginAttempts.delete(key);
}
