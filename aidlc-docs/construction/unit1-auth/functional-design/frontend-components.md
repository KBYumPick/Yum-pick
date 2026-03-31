# Frontend Components - Unit 1: 인증 (채원)

## 고객앱 (customer-app)

### 1. TableSetupPage (테이블 초기 설정 화면)

**역할**: 최초 1회 또는 자동 로그인 실패 시 표시되는 설정 화면

**Props**: 없음 (라우트 컴포넌트)

**State**:
```typescript
{
  storeId: string;       // 매장 식별자 입력값
  tableNumber: string;   // 테이블 번호 입력값
  password: string;      // 비밀번호 입력값
  isLoading: boolean;
  error: string | null;
}
```

**사용자 인터랙션**:
1. 폼 입력 (storeId, tableNumber, password)
2. "설정 완료" 버튼 클릭
3. 로그인 API 호출
4. 성공 → localStorage 저장 → MenuPage로 이동
5. 실패 → 에러 메시지 표시

**폼 유효성 검증**:
- storeId: 필수, 공백 불가
- tableNumber: 필수, 양의 정수
- password: 필수, 최소 1자

**API 연동**: `POST /api/auth/table/login`

---

### 2. CustomerAuthService (인증 서비스)

**역할**: localStorage 기반 자동 로그인 로직 관리

**주요 함수**:
```typescript
// localStorage에서 자격증명 로드 후 자동 로그인 시도
autoLogin(): Promise<boolean>

// 자격증명 저장
saveCredentials(storeId, tableNumber, password): void

// 자격증명 삭제
clearCredentials(): void

// 저장된 자격증명 존재 여부
hasCredentials(): boolean
```

**앱 초기화 흐름**:
```
App 마운트
  → hasCredentials() 확인
  → true: autoLogin() 시도
    → 성공: CustomerStore에 session 저장 → MenuPage
    → 실패: TableSetupPage
  → false: TableSetupPage
```

---

## 관리자앱 (admin-app)

### 3. LoginPage (관리자 로그인 화면)

**역할**: 관리자 로그인 폼

**Props**: 없음 (라우트 컴포넌트)

**State**:
```typescript
{
  storeId: string;
  username: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}
```

**사용자 인터랙션**:
1. 폼 입력 (storeId, username, password)
2. "로그인" 버튼 클릭 또는 Enter 키
3. 로그인 API 호출
4. 성공 → AdminStore에 auth 저장 → DashboardPage로 이동
5. 실패 → 에러 메시지 표시 (잠금 시 남은 시간 포함)

**폼 유효성 검증**:
- storeId: 필수
- username: 필수
- password: 필수

**API 연동**: `POST /api/auth/admin/login`

---

### 4. AdminAuthService (관리자 인증 서비스)

**역할**: 관리자 JWT 토큰 관리 및 세션 유지

**주요 함수**:
```typescript
// 토큰 저장 (localStorage)
saveToken(token: string): void

// 토큰 로드
getToken(): string | null

// 토큰 삭제 (로그아웃)
clearToken(): void

// 토큰 만료 여부 확인 (JWT decode)
isTokenExpired(): boolean

// 앱 초기화 시 세션 복원
restoreSession(): { token, storeId, username } | null
```

**세션 유지 흐름**:
```
AdminApp 마운트
  → restoreSession() 호출
  → 유효한 토큰 존재: AdminStore.auth 복원 → DashboardPage
  → 토큰 없거나 만료: LoginPage
```

**자동 로그아웃**:
- API 응답 401 수신 시 → clearToken() → LoginPage 리다이렉트
- Axios 인터셉터에서 처리

---

## 라우팅 구조

### 고객앱
```
/ → App (자동 로그인 처리)
  /setup → TableSetupPage
  /menu → MenuPage (인증 필요)
  /orders → OrderHistoryPage (인증 필요)
```

### 관리자앱
```
/ → App (세션 복원 처리)
  /login → LoginPage
  /dashboard → DashboardPage (인증 필요)
  /tables → TableManagementPage (인증 필요)
  /menus → MenuManagementPage (인증 필요)
```
