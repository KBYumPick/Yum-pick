import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { AuthTokenPayload } from '../types/auth';

// Express Request에 user 필드 추가
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

// JWT 인증 미들웨어 - 모든 보호된 라우트에 적용
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    return;
  }

  try {
    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: '유효하지 않거나 만료된 토큰입니다.' });
  }
}

// BR-AUTH-05: 관리자 역할 검증 미들웨어
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    return;
  }
  next();
}
