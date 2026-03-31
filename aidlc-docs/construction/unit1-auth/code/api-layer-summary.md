# API Layer Summary - Unit 1: 인증

## 엔드포인트

| Method | Route | 인증 | 설명 |
|--------|-------|------|------|
| POST | /api/auth/admin/login | 불필요 | 관리자 로그인 |
| POST | /api/auth/table/login | 불필요 | 테이블 로그인 |
| GET | /api/auth/verify | 필요 | 토큰 검증 |

## 미들웨어

| 이름 | 설명 |
|------|------|
| authenticate | JWT 토큰 검증, req.user 설정 |
| requireAdmin | role === 'admin' 검증 |

## 참고
- TableModel은 Unit 5 (준형)에서 생성 예정이므로, authController에서 mongoose.connection.db.collection('tables')로 직접 조회
- 통합 시 TableModel import로 교체 가능
