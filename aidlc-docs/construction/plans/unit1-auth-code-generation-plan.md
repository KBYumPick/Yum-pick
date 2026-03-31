# Code Generation Plan - Unit 1: 인증 (채원)

## Unit Context
- **담당**: 채원
- **범위**: 관리자 로그인 + 테이블 로그인 + JWT 미들웨어
- **User Stories**: US-01 (테이블 초기 설정), US-02 (테이블 자동 로그인), US-09 (관리자 로그인)
- **의존성**: 없음 (다른 유닛에서 이 유닛의 미들웨어를 사용)

## Code Location
- **백엔드**: `packages/server/src/`
- **고객앱**: `packages/customer-app/src/`
- **관리자앱**: `packages/admin-app/src/`

---

## Plan Steps

### Step 1: 프로젝트 구조 초기화
- [x] `packages/server/` - package.json, tsconfig.json
- [x] `packages/customer-app/` - Vite + React + TypeScript 초기 설정
- [x] `packages/admin-app/` - Vite + React + TypeScript 초기 설정
- [x] 루트 package.json (workspaces 설정)

### Step 2: 공통 타입 정의
- [x] `packages/server/src/types/auth.ts` - AuthToken, LoginRequest, LoginResponse 등 인증 관련 타입

### Step 3: AuthModel (비즈니스 로직)
- [x] `packages/server/src/models/AdminAccount.ts` - Mongoose 스키마 + 모델
- [x] `packages/server/src/utils/auth.ts` - JWT 생성/검증, bcrypt 해싱/비교, 로그인 시도 제한 (인메모리 Map)
- [x] BR-AUTH-01 ~ BR-AUTH-08 비즈니스 규칙 구현

### Step 4: AuthModel 비즈니스 로직 요약
- [x] `aidlc-docs/construction/unit1-auth/code/business-logic-summary.md`

### Step 5: Middleware (JWT 인증)
- [x] `packages/server/src/middleware/auth.ts` - authenticate, requireAdmin 미들웨어

### Step 6: AuthController + Routes (API 레이어)
- [x] `packages/server/src/controllers/authController.ts` - adminLogin, tableLogin, verifyToken
- [x] `packages/server/src/routes/auth.ts` - 라우트 정의

### Step 7: API 레이어 요약
- [x] `aidlc-docs/construction/unit1-auth/code/api-layer-summary.md`

### Step 8: 고객앱 - 인증 서비스 및 테이블 설정 화면
- [x] `packages/customer-app/src/services/authService.ts` - CustomerAuthService (autoLogin, saveCredentials, clearCredentials)
- [x] `packages/customer-app/src/services/api.ts` - Axios 인스턴스 (인터셉터 포함)
- [x] `packages/customer-app/src/pages/TableSetupPage.tsx` - 테이블 초기 설정 폼
- [x] `packages/customer-app/src/stores/authStore.ts` - 인증 상태 관리 (Zustand)
- [x] `packages/customer-app/src/App.tsx` - 라우팅 + 자동 로그인 흐름
- [x] US-01, US-02 구현

### Step 9: 관리자앱 - 로그인 화면 및 인증 서비스
- [x] `packages/admin-app/src/services/authService.ts` - AdminAuthService (saveToken, getToken, clearToken, isTokenExpired, restoreSession)
- [x] `packages/admin-app/src/services/api.ts` - Axios 인스턴스 (401 인터셉터)
- [x] `packages/admin-app/src/pages/LoginPage.tsx` - 관리자 로그인 폼
- [x] `packages/admin-app/src/stores/authStore.ts` - 관리자 인증 상태 관리 (Zustand)
- [x] `packages/admin-app/src/App.tsx` - 라우팅 + 세션 복원 흐름
- [x] US-09 구현

### Step 10: 프론트엔드 요약
- [x] `aidlc-docs/construction/unit1-auth/code/frontend-summary.md`

### Step 11: 서버 엔트리포인트 및 DB 연결
- [x] `packages/server/src/app.ts` - Express 앱 설정 (CORS, JSON 파싱, 라우트 등록)
- [x] `packages/server/src/server.ts` - MongoDB 연결 + 서버 시작
- [x] `packages/server/src/config/index.ts` - 환경변수 설정

### Step 12: 시드 스크립트
- [x] `packages/server/src/scripts/seed.ts` - 초기 관리자 계정 생성 스크립트

---

## Story Traceability

| Story | Step | 상태 |
|-------|------|------|
| US-01 (테이블 초기 설정) | Step 8 | [x] |
| US-02 (테이블 자동 로그인) | Step 8 | [x] |
| US-09 (관리자 로그인) | Step 9 | [x] |
