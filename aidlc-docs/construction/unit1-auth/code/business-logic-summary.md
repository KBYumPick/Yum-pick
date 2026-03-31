# Business Logic Summary - Unit 1: 인증

## 구현된 파일

### `models/AdminAccount.ts`
- Mongoose 스키마: storeId, username, passwordHash, createdAt
- 복합 유니크 인덱스: storeId + username

### `utils/auth.ts`
- `hashPassword()` / `comparePassword()` - bcrypt (saltRounds: 10)
- `generateToken()` / `verifyToken()` - JWT (16시간 만료)
- `checkLoginAttempts()` / `recordLoginFailure()` / `recordLoginSuccess()` - 인메모리 Map 기반 로그인 시도 제한 (5회 실패 → 15분 잠금)

### `config/index.ts`
- 환경변수 기반 설정 (PORT, MONGO_URI, JWT_SECRET, CORS_ORIGINS)

## 비즈니스 규칙 매핑

| 규칙 | 구현 위치 |
|------|-----------|
| BR-AUTH-01 (JWT 16시간) | utils/auth.ts - generateToken |
| BR-AUTH-02 (bcrypt 해싱) | utils/auth.ts - hashPassword, comparePassword |
| BR-AUTH-03 (관리자 로그인 제한) | utils/auth.ts - checkLoginAttempts, recordLoginFailure |
| BR-AUTH-04 (테이블 로그인 제한) | utils/auth.ts - 동일 함수 사용 |
| BR-AUTH-05 (역할 기반 접근) | Step 5 미들웨어에서 구현 |
| BR-AUTH-06 (세션 ID 생성) | Step 6 컨트롤러에서 구현 |
| BR-AUTH-07 (로컬 저장 자동 로그인) | Step 8 고객앱에서 구현 |
| BR-AUTH-08 (storeId 검증) | Step 6 컨트롤러에서 구현 |
