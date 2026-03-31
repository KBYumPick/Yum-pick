# Frontend Summary - Unit 1: 인증

## 고객앱 (customer-app)

| 파일 | 역할 |
|------|------|
| services/api.ts | Axios 인스턴스, Bearer 토큰 자동 첨부, 401 인터셉터 |
| services/authService.ts | autoLogin, login, saveCredentials, clearCredentials, hasCredentials |
| stores/authStore.ts | Zustand - token, sessionId, storeId, tableNumber 상태 관리 |
| pages/TableSetupPage.tsx | 테이블 초기 설정 폼 (US-01) |
| App.tsx | 자동 로그인 흐름 + 라우팅 (US-02) |

## 관리자앱 (admin-app)

| 파일 | 역할 |
|------|------|
| services/api.ts | Axios 인스턴스, Bearer 토큰 자동 첨부, 401 인터셉터 |
| services/authService.ts | login, logout, saveToken, getToken, clearToken, isTokenExpired, restoreSession |
| stores/authStore.ts | Zustand - token, storeId, isAuthenticated 상태 관리 |
| pages/LoginPage.tsx | 관리자 로그인 폼 (US-09) |
| App.tsx | 세션 복원 + 라우팅 + 로그아웃 |

## 다른 유닛과의 연결점
- 고객앱: /menu (Unit 2), /orders (Unit 3) 라우트는 placeholder로 설정
- 관리자앱: /dashboard (Unit 4), /tables (Unit 5), /menus (Unit 2) 라우트는 placeholder로 설정
- 통합 시 각 유닛의 페이지 컴포넌트로 교체
