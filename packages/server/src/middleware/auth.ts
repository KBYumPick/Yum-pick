// 인증 미들웨어 스텁
// ⚠️ Unit 5 스텁: Unit 1 (인증) 완성 시 이 파일은 대체됩니다.
// Unit 1에서 JWT 검증 및 역할 기반 접근 제어를 구현합니다.

import { Request, Response, NextFunction } from 'express';

/**
 * 관리자 인증 미들웨어 (스텁)
 * - 개발 환경에서는 Authorization 헤더의 JWT를 디코딩하여 req.user에 설정
 * - JWT가 없는 경우 기본 개발용 사용자 정보를 설정
 * - ⚠️ 프로덕션에서는 반드시 Unit 1의 실제 구현으로 교체해야 합니다.
 */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // 간단한 base64 디코딩 시도 (JWT payload 부분)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      (req as any).user = {
        storeId: payload.storeId,
        role: payload.role || 'admin',
      };
    } else {
      // 개발용 기본 사용자 (JWT 없는 경우)
      (req as any).user = {
        storeId: 'dev-store-id',
        role: 'admin',
      };
    }

    next();
  } catch {
    // 디코딩 실패 시에도 개발용 기본값 설정
    (req as any).user = {
      storeId: 'dev-store-id',
      role: 'admin',
    };
    next();
  }
};
