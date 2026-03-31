// 관리자 로그인 요청
export interface AdminLoginRequest {
  storeId: string;
  username: string;
  password: string;
}

// 테이블 로그인 요청
export interface TableLoginRequest {
  storeId: string;
  tableNumber: number;
  password: string;
}

// 로그인 응답 (관리자)
export interface AdminLoginResponse {
  token: string;
  expiresIn: number;
}

// 로그인 응답 (테이블)
export interface TableLoginResponse {
  token: string;
  sessionId: string;
  expiresIn: number;
}

// JWT 페이로드
export interface AuthTokenPayload {
  id: string;
  role: 'admin' | 'table';
  storeId: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

// 토큰 검증 응답
export interface VerifyTokenResponse {
  valid: boolean;
  role: string;
  storeId: string;
}

// 로그인 시도 기록 (인메모리)
export interface LoginAttemptRecord {
  count: number;
  lockedUntil: Date | null;
}
