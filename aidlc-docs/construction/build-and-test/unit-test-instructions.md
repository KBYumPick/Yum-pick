# 단위 테스트 실행 지침 (Unit Test Instructions)

냠픽(Yumpick) 테이블 오더 서비스 — 단위 테스트 가이드

---

## 1. 테스트 개요

| 패키지 | 테스트 파일 수 | 테스트 케이스 수 | 프레임워크 |
|--------|---------------|-----------------|-----------|
| `packages/server` | 4개 | 38개 | Jest |
| `packages/admin-app` | 5개 | 38개 | Jest + React Testing Library |
| **합계** | **9개** | **76개** | - |

---

## 2. 전체 테스트 실행

### 2.1 모든 패키지 일괄 실행

```bash
# 모노레포 루트에서 실행
npm test --workspaces
```

### 2.2 패키지별 개별 실행

```bash
# 서버 테스트만 실행
npm test --workspace=packages/server

# 관리자 앱 테스트만 실행
npm test --workspace=packages/admin-app
```

---

## 3. 백엔드 단위 테스트 (`packages/server`)

### 3.1 실행 명령

```bash
cd packages/server
npm test
```

단일 실행 (watch 모드 없이):

```bash
cd packages/server
npm test -- --watchAll=false
```

### 3.2 테스트 파일 목록 및 케이스 상세

#### `TableModel.test.ts` — 11개 테스트 케이스

MongoDB Mongoose 스키마 검증 테스트 (DB 연결 불필요, 스키마 레벨 검증)

| # | 테스트 케이스 | 검증 내용 |
|---|--------------|-----------|
| 1 | storeId 누락 시 validation error 발생 | 필수 필드 검증 |
| 2 | tableNumber 누락 시 validation error 발생 | 필수 필드 검증 |
| 3 | password 누락 시 validation error 발생 | 필수 필드 검증 |
| 4 | 모든 필수 필드 제공 시 validation 통과 | 정상 케이스 |
| 5 | isActive 기본값은 false | 기본값 검증 |
| 6 | currentSessionId 기본값은 null | 기본값 검증 |
| 7 | sessionStartedAt 기본값은 null | 기본값 검증 |
| 8 | password 필드가 응답에서 제거됨 | toJSON transform (BR-TABLE-02) |
| 9 | __v 필드가 응답에서 제거됨 | toJSON transform |
| 10 | 다른 필드(storeId, tableNumber 등)는 유지됨 | toJSON transform |
| 11 | { storeId, tableNumber } 복합 유니크 인덱스가 정의됨 | BR-TABLE-01 |

#### `SessionService.test.ts` — 3개 테스트 케이스

세션 종료 서비스 로직 테스트 (TableModel mock 사용)

| # | 테스트 케이스 | 검증 내용 |
|---|--------------|-----------|
| 1 | 활성 세션 테이블의 세션을 정상 종료함 | isActive=false, null 처리 |
| 2 | 테이블이 존재하지 않으면 에러를 throw함 | 404 케이스 |
| 3 | 이미 비활성 상태인 테이블이면 에러를 throw함 | BR-TABLE-03 |

#### `TableController.test.ts` — 17개 테스트 케이스

5개 핸들러 전체 테스트 (TableModel, bcrypt, SessionService mock 사용)

| # | 핸들러 | 테스트 케이스 | 검증 내용 |
|---|--------|--------------|-----------|
| 1 | listTables | storeId 쿼리 파라미터 누락 시 400 반환 | 입력 검증 |
| 2 | listTables | JWT storeId와 쿼리 storeId 불일치 시 403 반환 | BR-TABLE-08 |
| 3 | listTables | 정상 요청 시 200 + tableNumber 오름차순 정렬 결과 반환 | BR-TABLE-07 |
| 4 | createTable | 정상 요청 시 201 + bcrypt 해싱 후 테이블 생성 | BR-TABLE-02 |
| 5 | createTable | 동일 매장 내 중복 tableNumber 시 400 반환 | BR-TABLE-01 |
| 6 | createTable | 필수 필드(password) 누락 시 400 반환 | 입력 검증 |
| 7 | createTable | 필수 필드(storeId) 누락 시 400 반환 | 입력 검증 |
| 8 | updateTable | 정상 수정 시 200 반환 | 정상 케이스 |
| 9 | updateTable | 테이블 미존재 시 404 반환 | 에러 케이스 |
| 10 | updateTable | storeId 불일치 시 403 반환 | BR-TABLE-08 |
| 11 | updateTable | 변경하려는 tableNumber가 이미 존재하면 400 반환 | BR-TABLE-01 |
| 12 | updateTable | password가 빈 문자열이면 기존 비밀번호 유지 | BR-TABLE-06 |
| 13 | updateTable | password 필드 미포함 시 기존 비밀번호 유지 | BR-TABLE-06 |
| 14 | deleteTable | 비활성 테이블 정상 삭제 시 200 반환 | 정상 케이스 |
| 15 | deleteTable | 활성 세션이 있는 테이블 삭제 시 400 반환 | BR-TABLE-04 |
| 16 | deleteTable | 테이블 미존재 시 404 반환 | 에러 케이스 |
| 17 | endSession | 활성 세션 테이블의 세션 종료 시 200 반환 | 정상 케이스 |

> 참고: `endSession` 핸들러의 비활성 테이블 400, 미존재 404 케이스는 `TableController.test.ts`에 포함되어 있습니다.

#### `OrderHistoryController.test.ts` — 8개 테스트 케이스

과거 주문 내역 조회 컨트롤러 테스트 (TableModel, OrderModel mock 사용)

| # | 테스트 케이스 | 검증 내용 |
|---|--------------|-----------|
| 1 | storeId 누락 시 400 반환 | 입력 검증 |
| 2 | tableId 누락 시 400 반환 | 입력 검증 |
| 3 | JWT storeId와 쿼리 storeId 불일치 시 403 반환 | BR-TABLE-08 |
| 4 | 테이블 미존재 시 404 반환 | 에러 케이스 |
| 5 | 활성 세션이 있는 테이블 조회 시 현재 세션 주문 제외 | BR-TABLE-05 |
| 6 | 비활성 테이블 조회 시 sessionId 필터 없이 전체 주문 반환 | 정상 케이스 |
| 7 | date 파라미터 전달 시 해당 날짜 범위 필터 적용 | BR-TABLE-05 |
| 8 | 결과가 createdAt 내림차순으로 정렬됨 | 정렬 검증 |

---

## 4. 프론트엔드 단위 테스트 (`packages/admin-app`)

### 4.1 실행 명령

```bash
cd packages/admin-app
npm test
```

단일 실행 (watch 모드 없이):

```bash
cd packages/admin-app
npm test -- --watchAll=false
```

### 4.2 테스트 파일 목록 및 케이스 상세

#### `adminTableStore.test.ts` — 10개 테스트 케이스

Zustand 스토어 액션 테스트 (fetch mock, localStorage stub 사용)

| # | 액션 | 테스트 케이스 | 검증 내용 |
|---|------|--------------|-----------|
| 1 | fetchTables | API 호출 후 tables 상태를 설정한다 | 정상 케이스 |
| 2 | fetchTables | API 실패 시 error 상태를 설정한다 | 에러 케이스 |
| 3 | createTable | API 호출 후 테이블을 추가하고 tableNumber 오름차순 정렬한다 | 정렬 검증 |
| 4 | createTable | API 실패 시 error 설정 후 에러를 re-throw 한다 | 에러 케이스 |
| 5 | updateTable | API 호출 후 해당 테이블을 교체한다 | 정상 케이스 |
| 6 | updateTable | API 실패 시 error 설정 후 에러를 re-throw 한다 | 에러 케이스 |
| 7 | deleteTable | API 호출 후 해당 테이블을 제거한다 | 정상 케이스 |
| 8 | deleteTable | API 실패 시 error 상태를 설정한다 | 에러 케이스 |
| 9 | endTableSession | API 호출 후 로컬 상태를 비활성으로 업데이트한다 | 상태 업데이트 |
| 10 | endTableSession | API 실패 시 error 상태를 설정한다 | 에러 케이스 |

#### `TableManagementPage.test.tsx` — 7개 테스트 케이스

페이지 컴포넌트 통합 렌더링 테스트 (스토어 mock, 하위 컴포넌트 mock 사용)

| # | 테스트 케이스 | 검증 내용 |
|---|--------------|-----------|
| 1 | 마운트 시 fetchTables를 호출한다 | 초기 데이터 로드 |
| 2 | 각 테이블에 대해 TableCard를 렌더링한다 | 목록 렌더링 |
| 3 | "테이블 추가" 버튼 클릭 시 TableForm 모달이 열린다 | 모달 열기 |
| 4 | 삭제 확인 다이얼로그에서 확인 시 deleteTable을 호출한다 | 삭제 확인 |
| 5 | 삭제 확인 다이얼로그에서 취소 시 deleteTable을 호출하지 않는다 | 삭제 취소 |
| 6 | 세션 종료 확인 다이얼로그에서 확인 시 endTableSession을 호출한다 | 세션 종료 확인 |
| 7 | 세션 종료 확인 다이얼로그에서 취소 시 endTableSession을 호출하지 않는다 | 세션 종료 취소 |

#### `TableCard.test.tsx` — 8개 테스트 케이스

테이블 카드 컴포넌트 UI 상태 테스트

| # | 상태 | 테스트 케이스 | 검증 내용 |
|---|------|--------------|-----------|
| 1 | isActive=true | "이용 중" 배지를 표시한다 | 상태 배지 |
| 2 | isActive=true | 세션 시간을 표시한다 | 세션 정보 |
| 3 | isActive=true | "이용 완료" 버튼이 활성화되어 있다 | 버튼 상태 |
| 4 | isActive=true | "삭제" 버튼이 비활성화되어 있다 | BR-TABLE-04 |
| 5 | isActive=false | "비어 있음" 배지를 표시한다 | 상태 배지 |
| 6 | isActive=false | 세션 시간을 표시하지 않는다 | 세션 정보 없음 |
| 7 | isActive=false | "이용 완료" 버튼이 비활성화되어 있다 | 버튼 상태 |
| 8 | isActive=false | "삭제" 버튼이 활성화되어 있다 | 버튼 상태 |

> 참고: 버튼 콜백 테스트 4개(onEdit, onDelete, onEndSession, onViewHistory)가 추가로 포함되어 있습니다.

#### `TableForm.test.tsx` — 8개 테스트 케이스

테이블 등록/수정 폼 컴포넌트 테스트

| # | 모드 | 테스트 케이스 | 검증 내용 |
|---|------|--------------|-----------|
| 1 | 등록 | 제목이 "테이블 추가"이다 | 제목 표시 |
| 2 | 등록 | 테이블 번호 입력이 비어 있다 | 초기 상태 |
| 3 | 등록 | 비밀번호 없이 제출 시 유효성 에러를 표시한다 | 필수 검증 |
| 4 | 등록 | 테이블 번호 없이 제출 시 유효성 에러를 표시한다 | 필수 검증 |
| 5 | 등록 | 올바른 데이터로 제출 시 onSubmit을 호출한다 | 정상 제출 |
| 6 | 수정 | 제목이 "테이블 수정"이다 | 제목 표시 |
| 7 | 수정 | 테이블 번호가 기존 값으로 프리필된다 | 초기값 |
| 8 | 수정 | 비밀번호 없이도 제출할 수 있다 (선택적 변경) | BR-TABLE-06 |

#### `OrderHistoryModal.test.tsx` — 8개 테스트 케이스

과거 주문 내역 모달 컴포넌트 테스트 (fetch mock 사용)

| # | 테스트 케이스 | 검증 내용 |
|---|--------------|-----------|
| 1 | 마운트 시 주문 내역을 fetch한다 | 초기 데이터 로드 |
| 2 | 주문 내역이 없을 때 빈 상태 메시지를 표시한다 | 빈 상태 UI |
| 3 | 주문 항목을 올바르게 렌더링한다 | 목록 렌더링 |
| 4 | 날짜 필터 변경 시 재조회한다 | 필터 동작 |
| 5 | 날짜 필터 적용 후 빈 상태 메시지가 날짜 관련 메시지로 변경된다 | 조건부 메시지 |
| 6 | "전체 보기" 버튼 클릭 시 날짜 필터를 초기화하고 재조회한다 | 필터 초기화 |
| 7 | 닫기 버튼 클릭 시 onClose를 호출한다 | 모달 닫기 |
| 8 | 제목에 테이블 번호가 표시된다 | 제목 표시 |

---

## 5. 커버리지 리포트 생성

```bash
# 서버 커버리지
cd packages/server
npm test -- --coverage --watchAll=false

# 관리자 앱 커버리지
cd packages/admin-app
npm test -- --coverage --watchAll=false
```

커버리지 리포트 위치:
- `packages/server/coverage/lcov-report/index.html`
- `packages/admin-app/coverage/lcov-report/index.html`

브라우저에서 열기:

```bash
open packages/server/coverage/lcov-report/index.html
open packages/admin-app/coverage/lcov-report/index.html
```

---

## 6. 특정 테스트 파일만 실행

```bash
# 특정 파일만 실행
cd packages/server
npm test -- --testPathPattern="TableController"

# 특정 describe 블록만 실행
npm test -- --testNamePattern="createTable"
```

---

## 7. 예상 결과 (Expected Results)

```
Test Suites: 9 passed, 9 total
Tests:       76 passed, 0 failed, 0 total
Snapshots:   0 total
Time:        ~5s
```

모든 테스트가 통과해야 하며 실패 케이스는 0건이어야 합니다.

---

## 8. 실패 테스트 수정 방법

### 8.1 mock 관련 오류

**증상**: `Cannot find module '../../models/TableModel'`

**해결**:
```bash
# 경로 확인 후 import 경로 수정
# tsconfig.json의 paths 설정 확인
cat packages/server/tsconfig.json
```

### 8.2 React Testing Library 오류

**증상**: `Unable to find an element by: [data-testid="..."]`

**해결**:
- 컴포넌트에 해당 `data-testid` 속성이 있는지 확인
- `waitFor`를 사용하여 비동기 렌더링 대기

```typescript
await waitFor(() => {
  expect(screen.getByTestId('table-form')).toBeInTheDocument();
});
```

### 8.3 TypeScript 타입 오류

**증상**: `Type 'X' is not assignable to type 'Y'`

**해결**:
```bash
# shared 패키지 타입 재빌드
cd packages/shared && npm run build && cd ../..
# 이후 테스트 재실행
```

### 8.4 Jest 환경 설정 오류

**증상**: `ReferenceError: fetch is not defined`

**해결**: `jest.config.ts`에서 `testEnvironment: 'jsdom'` 설정 확인 (admin-app)

```bash
cat packages/admin-app/jest.config.ts
```
