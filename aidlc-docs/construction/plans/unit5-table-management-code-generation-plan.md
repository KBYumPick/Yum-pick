# Code Generation Plan - Unit 5: 테이블 관리 (준형 담당)

## 유닛 개요

- **유닛**: Unit 5 - 테이블 관리 (Table Management)
- **담당자**: 준형
- **범위**: 테이블 CRUD + 세션 관리 + 과거 주문 조회
- **User Stories**: US-13 (테이블 등록/수정), US-14 (테이블 이용 완료/세션 종료), US-15 (과거 주문 내역 조회)

## 스토리 추적표

| Story | 설명 | 관련 Step |
|-------|------|-----------|
| US-13 | 테이블 등록/수정/삭제, 목록 조회 | Step 1~8, 10~14 |
| US-14 | 테이블 이용 완료 (세션 종료) | Step 4, 5, 6, 10, 12 |
| US-15 | 과거 주문 내역 조회 | Step 7, 10, 14 |

## 타 유닛 의존성

| 의존 대상 | 유닛 | 설명 |
|-----------|------|------|
| `requireAdmin` 미들웨어 | Unit 1 (채원) | 모든 테이블 API에 관리자 인증 필요 |
| `OrderModel` (Mongoose) | Unit 3 (유진) | 과거 주문 조회 시 Order 컬렉션 참조 |
| `AdminStore` (auth 부분) | Unit 1 (채원) | storeId 참조, JWT 토큰 관리 |
| `api` (axios 인스턴스) | Unit 1 (채원) | API 호출 시 공통 axios 인스턴스 사용 |

> **참고**: 의존 유닛이 미완성인 경우, 해당 모듈의 인터페이스만 참조하여 stub/mock으로 대체합니다.

## 코드 위치 규칙

- **애플리케이션 코드**: `yumpick/packages/` (워크스페이스 루트)
- **문서**: `aidlc-docs/construction/unit5-table-management/code/`
- **테스트**: 각 패키지 내 `__tests__/` 디렉토리

---

## Plan Steps

### Step 1: 프로젝트 구조 셋업 (Unit 5 전용 파일) — US-13, US-14, US-15

> 모노레포 스켈레톤은 다른 유닛에서 이미 생성되었다고 가정합니다.
> Unit 5에서 필요한 파일/디렉토리만 생성합니다.

- [x] 1.1 백엔드 파일 생성 (빈 파일 또는 boilerplate)
  - `packages/server/src/models/TableModel.ts`
  - `packages/server/src/services/SessionService.ts`
  - `packages/server/src/controllers/TableController.ts`
  - `packages/server/src/controllers/OrderHistoryController.ts`
  - `packages/server/src/routes/tableRoutes.ts`
  - `packages/server/src/routes/orderHistoryRoutes.ts`
- [x] 1.2 프론트엔드 파일 생성 (빈 파일 또는 boilerplate)
  - `packages/admin-app/src/pages/TableManagementPage.tsx`
  - `packages/admin-app/src/components/TableCard.tsx`
  - `packages/admin-app/src/components/TableForm.tsx`
  - `packages/admin-app/src/components/OrderHistoryModal.tsx`
  - `packages/admin-app/src/stores/adminTableStore.ts`
- [x] 1.3 테스트 디렉토리 생성
  - `packages/server/src/__tests__/table/`
  - `packages/admin-app/src/__tests__/table/`

---

### Step 2: 공유 타입 정의 (Shared Types) — US-13, US-14, US-15

> `packages/shared/src/types/` 에 테이블 관련 TypeScript 인터페이스를 정의합니다.

- [x] 2.1 `packages/shared/src/types/table.ts` 생성
  - `ITable` 인터페이스 (API 응답용, password 제외)
    - `_id: string`
    - `storeId: string`
    - `tableNumber: number`
    - `currentSessionId: string | null`
    - `sessionStartedAt: string | null` (ISO 문자열)
    - `isActive: boolean`
    - `createdAt: string`
    - `updatedAt: string`
  - `ICreateTableRequest` 인터페이스: `{ storeId: string; tableNumber: number; password: string }`
  - `IUpdateTableRequest` 인터페이스: `{ tableNumber?: number; password?: string }`
  - `ITableFormData` 인터페이스: `{ tableNumber: number; password: string }`
- [x] 2.2 `packages/shared/src/types/orderHistory.ts` 생성
  - `IOrderHistoryItem` 인터페이스 (menuName, quantity, unitPrice)
  - `IOrderHistory` 인터페이스 (_id, storeId, tableId, sessionId, orderNumber, items, totalAmount, status, createdAt)
  - `IOrderHistoryQuery` 인터페이스: `{ storeId: string; tableId: string; date?: string }`
- [x] 2.3 `packages/shared/src/types/index.ts`에 table, orderHistory 타입 re-export 추가
  - 기존 index.ts가 있으면 export 추가, 없으면 생성

---

### Step 3: TableModel (Mongoose 스키마) — US-13

> `packages/server/src/models/TableModel.ts`

- [x] 3.1 Mongoose 스키마 정의
  - `storeId`: `String`, required, index
  - `tableNumber`: `Number`, required
  - `password`: `String`, required (bcrypt 해싱된 값 저장)
  - `currentSessionId`: `String`, default `null`
  - `sessionStartedAt`: `Date`, default `null`
  - `isActive`: `Boolean`, default `false`
  - `timestamps: true` (createdAt, updatedAt 자동 생성)
- [x] 3.2 복합 유니크 인덱스 설정
  - `{ storeId: 1, tableNumber: 1 }` unique compound index (BR-TABLE-01)
- [x] 3.3 `toJSON` transform 설정
  - 응답 시 `password` 필드 자동 제거 (BR-TABLE-02)
  - `__v` 필드 제거
- [x] 3.4 모델 export: `export default mongoose.model<ITableDocument>('Table', tableSchema)`

---

### Step 4: SessionService — US-14

> `packages/server/src/services/SessionService.ts`

- [x] 4.1 `endSession(tableId: string): Promise<void>` 메서드 구현
  - TableModel.findById(tableId)로 테이블 조회
  - 테이블 미존재 시 Error throw ('Table not found')
  - isActive === false 시 Error throw ('No active session')
  - TableModel.findByIdAndUpdate로 상태 업데이트 (BR-TABLE-03):
    - `isActive: false`
    - `currentSessionId: null`
    - `sessionStartedAt: null`
  - 주문 데이터는 별도 처리 없음 (그대로 유지)
- [x] 4.2 SessionService를 싱글톤 또는 클래스 인스턴스로 export
  - 한국어 주석으로 각 단계 설명 추가

---

### Step 5: TableController (테이블 CRUD + 세션 종료) — US-13, US-14

> `packages/server/src/controllers/TableController.ts`

- [x] 5.1 `listTables` — GET /api/table/list?storeId=
  - storeId 쿼리 파라미터 필수 검증 (없으면 400)
  - JWT storeId와 쿼리 storeId 일치 확인 (BR-TABLE-08, 불일치 시 403)
  - `TableModel.find({ storeId }).sort({ tableNumber: 1 })` (BR-TABLE-07)
  - password 필드 제외하여 응답 (BR-TABLE-02, toJSON transform 또는 select('-password'))
  - 응답: `200 OK` + `Table[]`
- [x] 5.2 `createTable` — POST /api/table/create
  - Body 유효성 검증: storeId, tableNumber (양의 정수), password (최소 1자) 필수
  - 중복 확인: `TableModel.findOne({ storeId, tableNumber })` (BR-TABLE-01)
    - 존재 시 400 "이미 존재하는 테이블 번호입니다."
  - 비밀번호 해싱: `bcrypt.hash(password, 10)` (BR-TABLE-02)
  - `TableModel.create({ storeId, tableNumber, password: hashedPassword, currentSessionId: null, sessionStartedAt: null, isActive: false })`
  - 응답: `201 Created` + 생성된 Table (password 제외)
- [x] 5.3 `updateTable` — PUT /api/table/update/:id
  - `TableModel.findById(id)` → 없으면 404
  - storeId 소유권 확인 (BR-TABLE-08, 불일치 시 403)
  - tableNumber 변경 시 중복 확인: `findOne({ storeId, tableNumber, _id: { $ne: id } })` (BR-TABLE-01)
  - password 처리 (BR-TABLE-06):
    - password가 있고 빈 문자열이 아니면 → `bcrypt.hash(password, 10)`
    - password가 없거나 빈 문자열이면 → 기존 password 유지
  - `TableModel.findByIdAndUpdate(id, updateData, { new: true })`
  - 응답: `200 OK` + 수정된 Table (password 제외)
- [x] 5.4 `deleteTable` — DELETE /api/table/delete/:id
  - `TableModel.findById(id)` → 없으면 404
  - storeId 소유권 확인 (BR-TABLE-08)
  - 활성 세션 확인 (BR-TABLE-04):
    - `isActive === true` → 400 "이용 중인 테이블은 삭제할 수 없습니다."
  - `TableModel.findByIdAndDelete(id)`
  - 응답: `200 OK` + `{ success: true }`
- [x] 5.5 `endSession` — POST /api/table/end-session/:id
  - `TableModel.findById(id)` → 없으면 404
  - storeId 소유권 확인 (BR-TABLE-08)
  - 활성 세션 확인 (BR-TABLE-03):
    - `isActive === false` → 400 "활성 세션이 없는 테이블입니다."
  - `SessionService.endSession(tableId)` 호출
  - 응답: `200 OK` + `{ success: true }`
- [x] 5.6 모든 핸들러에 try-catch 에러 처리 + 한국어 주석 추가

---

### Step 6: 테이블 라우트 정의 — US-13, US-14

> `packages/server/src/routes/tableRoutes.ts`

- [x] 6.1 Express Router 생성 및 엔드포인트 매핑
  - `GET /list` → `TableController.listTables` (requireAdmin)
  - `POST /create` → `TableController.createTable` (requireAdmin)
  - `PUT /update/:id` → `TableController.updateTable` (requireAdmin)
  - `DELETE /delete/:id` → `TableController.deleteTable` (requireAdmin)
  - `POST /end-session/:id` → `TableController.endSession` (requireAdmin)
- [x] 6.2 `requireAdmin` 미들웨어 import (Unit 1 의존)
  - Unit 1 미완성 시 stub 미들웨어로 대체 가능하도록 주석 표기
- [x] 6.3 라우터 export: `export default router` (app.ts에서 `/api/table` prefix로 마운트)

---

### Step 7: 과거 주문 조회 엔드포인트 — US-15

> `packages/server/src/controllers/OrderHistoryController.ts`
> `packages/server/src/routes/orderHistoryRoutes.ts`

- [x] 7.1 `OrderHistoryController.listHistory` 구현 — GET /api/order/history
  - 쿼리 파라미터: `storeId` (필수), `tableId` (필수), `date` (선택, YYYY-MM-DD)
  - storeId 소유권 확인 (BR-TABLE-08)
  - `TableModel.findById(tableId)` → 없으면 404
  - 쿼리 조건 구성 (BR-TABLE-05):
    - 기본: `{ storeId, tableId }`
    - 활성 세션 주문 제외: `table.isActive && table.currentSessionId` 이면 `sessionId: { $ne: table.currentSessionId }`
    - 날짜 필터: `date` 파라미터 있으면 `createdAt: { $gte: startOfDay, $lte: endOfDay }` (UTC 기준)
  - `OrderModel.find(query).sort({ createdAt: -1 })` (최신 주문 먼저)
  - 응답: `200 OK` + `Order[]`
  - **의존**: `OrderModel` (Unit 3, 유진 담당) — 미완성 시 인터페이스만 참조
- [x] 7.2 `orderHistoryRoutes.ts` 라우트 정의
  - `GET /history` → `OrderHistoryController.listHistory` (requireAdmin)
  - 라우터 export (app.ts에서 `/api/order` prefix로 마운트, Unit 3 orderRoutes와 병합 또는 별도 마운트)
- [x] 7.3 한국어 주석으로 비즈니스 규칙 참조 표기 (BR-TABLE-05, BR-TABLE-08)

---

### Step 8: 백엔드 유닛 테스트 — US-13, US-14, US-15

> `packages/server/src/__tests__/table/`

- [x] 8.1 `TableModel.test.ts` — 모델 테스트
  - 필수 필드 누락 시 validation error 확인
  - unique compound index 위반 시 duplicate key error 확인
  - toJSON transform에서 password 제거 확인
  - isActive 기본값 false 확인
- [x] 8.2 `SessionService.test.ts` — 서비스 테스트
  - 정상 세션 종료: isActive=true → false, currentSessionId=null, sessionStartedAt=null
  - 존재하지 않는 테이블 ID → Error throw
  - 이미 비활성 테이블 → Error throw
- [x] 8.3 `TableController.test.ts` — 컨트롤러 테스트
  - **listTables**: storeId 누락 시 400, storeId 불일치 시 403, 정상 조회 시 tableNumber 오름차순 + password 미포함
  - **createTable**: 정상 등록 201, 중복 tableNumber 400, 필수 필드 누락 400, password bcrypt 해싱 확인
  - **updateTable**: 정상 수정 200, 존재하지 않는 ID 404, storeId 불일치 403, tableNumber 중복 400, password 빈 문자열 시 기존 유지
  - **deleteTable**: 정상 삭제 200, 활성 세션 테이블 삭제 시도 400 (BR-TABLE-04), 존재하지 않는 ID 404
  - **endSession**: 정상 종료 200, 비활성 테이블 종료 시도 400, 존재하지 않는 ID 404
- [x] 8.4 `OrderHistoryController.test.ts` — 과거 주문 조회 테스트
  - storeId/tableId 필수 파라미터 누락 시 400
  - 정상 조회: 종료된 세션 주문만 반환, createdAt 내림차순
  - 날짜 필터 적용 확인
  - 활성 세션 주문 제외 확인
  - 존재하지 않는 tableId 404

---

### Step 9: 백엔드 코드 요약 문서 — US-13, US-14, US-15

> `aidlc-docs/construction/unit5-table-management/code/backend-summary.md`

- [x] 9.1 백엔드 코드 요약 마크다운 작성
  - 생성된 파일 목록 및 경로
  - 각 파일의 역할 및 주요 로직 요약
  - API 엔드포인트 목록 (메서드, 경로, 설명, 인증 요구사항)
  - 비즈니스 규칙 매핑 (BR-TABLE-01 ~ BR-TABLE-08 → 구현 위치)
  - 의존성 참조 (Unit 1 미들웨어, Unit 3 OrderModel)
  - 테스트 파일 목록 및 커버리지 범위

---

### Step 10: 프론트엔드 — AdminStore tables 슬라이스 (Zustand) — US-13, US-14

> `packages/admin-app/src/stores/adminTableStore.ts`

- [x] 10.1 Zustand store 정의 (`useAdminTableStore` 또는 기존 `useAdminStore`에 tables 슬라이스 추가)
  - **State**:
    - `tables: ITable[]`
    - `isLoading: boolean`
    - `error: string | null`
  - **Actions**:
    - `fetchTables()`: `GET /api/table/list?storeId={storeId}` → tables 상태 업데이트
    - `createTable(data: ITableFormData)`: `POST /api/table/create` → tables에 추가 후 tableNumber 오름차순 재정렬
    - `updateTable(id: string, data: IUpdateTableRequest)`: `PUT /api/table/update/{id}` → tables에서 해당 항목 교체
    - `deleteTable(id: string)`: `DELETE /api/table/delete/{id}` → tables에서 해당 항목 제거
    - `endTableSession(tableId: string)`: `POST /api/table/end-session/{tableId}` → 해당 테이블 isActive=false, currentSessionId=null, sessionStartedAt=null로 로컬 상태 업데이트
- [x] 10.2 에러 처리: API 호출 실패 시 error 상태 업데이트, isLoading 토글
- [x] 10.3 `auth.storeId` 참조 (Unit 1 AdminAuthService 의존)
  - 미완성 시 하드코딩 또는 환경변수로 대체 가능하도록 주석 표기
- [x] 10.4 한국어 주석으로 각 액션의 비즈니스 규칙 참조 표기

---

### Step 11: 프론트엔드 — TableManagementPage — US-13, US-14, US-15

> `packages/admin-app/src/pages/TableManagementPage.tsx`

- [x] 11.1 페이지 컴포넌트 구현
  - 라우트: `/tables` (requireAdmin 보호)
  - 마운트 시 `fetchTables()` 호출
  - 로컬 state: `isFormOpen`, `editingTable`, `historyTableId`
- [x] 11.2 레이아웃 구현
  - 상단: 페이지 제목 "테이블 관리" + "테이블 추가" 버튼
  - 본문: TableCard 그리드 (tables 배열 map)
  - 모달: TableForm (isFormOpen=true일 때), OrderHistoryModal (historyTableId !== null일 때)
- [x] 11.3 사용자 인터랙션 핸들러
  - "테이블 추가" 클릭 → `isFormOpen=true, editingTable=null`
  - TableCard 수정 → `isFormOpen=true, editingTable=table`
  - TableCard 삭제 → `window.confirm("테이블을 삭제하시겠습니까?")` → `deleteTable(id)`
  - TableCard 이용 완료 → `window.confirm("테이블 세션을 종료하시겠습니까? 현재 주문 내역은 과거 이력으로 이동됩니다.")` → `endTableSession(id)`
  - TableCard 주문 내역 → `historyTableId=table._id`
- [x] 11.4 `data-testid` 속성 부여 (자동화 테스트 친화적)
  - `data-testid="table-management-page"`
  - `data-testid="add-table-button"`
  - `data-testid="table-card-{tableNumber}"` (각 TableCard 래퍼)
  - `data-testid="table-grid"`

---

### Step 12: 프론트엔드 — TableCard — US-13, US-14

> `packages/admin-app/src/components/TableCard.tsx`

- [x] 12.1 Props 인터페이스 구현
  - `table: ITable`
  - `onEdit: (table: ITable) => void`
  - `onDelete: (tableId: string) => void`
  - `onEndSession: (tableId: string) => void`
  - `onViewHistory: (tableId: string) => void`
- [x] 12.2 카드 UI 구현
  - 테이블 번호 표시: "테이블 {tableNumber}"
  - 상태 배지: `isActive=true` → 초록색 "이용 중", `isActive=false` → 회색 "비어 있음"
  - 세션 시작 시각: `isActive=true`일 때만 `sessionStartedAt` 표시 (상대 시간, 예: "2시간 전")
- [x] 12.3 액션 버튼 구현
  - "수정" 버튼 → `onEdit(table)` (항상 활성)
  - "삭제" 버튼 → `onDelete(table._id)` (`isActive=true`이면 disabled, BR-TABLE-04)
  - "이용 완료" 버튼 → `onEndSession(table._id)` (`isActive=true`일 때만 활성)
  - "주문 내역" 버튼 → `onViewHistory(table._id)` (항상 활성)
- [x] 12.4 `data-testid` 속성 부여
  - `data-testid="table-card"` (카드 래퍼)
  - `data-testid="table-status-badge"` (상태 배지)
  - `data-testid="table-edit-button"` (수정 버튼)
  - `data-testid="table-delete-button"` (삭제 버튼)
  - `data-testid="table-end-session-button"` (이용 완료 버튼)
  - `data-testid="table-view-history-button"` (주문 내역 버튼)
  - `data-testid="table-session-time"` (세션 시작 시각)

---

### Step 13: 프론트엔드 — TableForm (등록/수정 모달) — US-13

> `packages/admin-app/src/components/TableForm.tsx`

- [x] 13.1 Props 인터페이스 구현
  - `table: ITable | null` (null이면 등록 모드, 값이면 수정 모드)
  - `onClose: () => void`
  - `onSubmit: (data: ITableFormData) => Promise<void>`
- [x] 13.2 폼 state 관리
  - `tableNumber: string` (입력값, submit 시 number 변환)
  - `password: string`
  - `isLoading: boolean`
  - `error: string | null`
- [x] 13.3 모드별 동작 구현
  - **등록 모드** (`table === null`):
    - 제목: "테이블 추가"
    - tableNumber: 빈 값, password: 빈 값 (필수)
    - submit → `onSubmit({ tableNumber: Number(tableNumber), password })`
  - **수정 모드** (`table !== null`):
    - 제목: "테이블 수정"
    - tableNumber: `table.tableNumber`로 초기화
    - password: 빈 값 (힌트: "변경하지 않으려면 비워두세요")
    - submit → `onSubmit({ tableNumber: Number(tableNumber), password })`
- [x] 13.4 폼 유효성 검증
  - tableNumber: 필수, 양의 정수 (빈 값 또는 0 이하 시 에러)
  - password: 등록 모드에서 필수, 수정 모드에서 선택
- [x] 13.5 에러 처리
  - API 오류 메시지를 폼 하단에 표시 (서버 오류 메시지 그대로)
  - submit 중 isLoading=true, 완료 후 false
- [x] 13.6 `data-testid` 속성 부여
  - `data-testid="table-form"` (폼 래퍼)
  - `data-testid="table-form-title"` (제목)
  - `data-testid="table-number-input"` (테이블 번호 입력)
  - `data-testid="table-password-input"` (비밀번호 입력)
  - `data-testid="table-form-error"` (에러 메시지)
  - `data-testid="table-form-cancel-button"` (취소 버튼)
  - `data-testid="table-form-submit-button"` (저장 버튼)

---

### Step 14: 프론트엔드 — OrderHistoryModal — US-15

> `packages/admin-app/src/components/OrderHistoryModal.tsx`

- [x] 14.1 Props 인터페이스 구현
  - `tableId: string`
  - `tableNumber: number`
  - `onClose: () => void`
- [x] 14.2 로컬 state 관리
  - `orders: IOrderHistory[]`
  - `selectedDate: string` (YYYY-MM-DD, 빈 문자열이면 전체 조회)
  - `isLoading: boolean`
  - `error: string | null`
- [x] 14.3 데이터 로딩 로직
  - 마운트 시 `fetchHistory(tableId, '')` 호출 (전체 과거 주문 로드)
  - `selectedDate` 변경 시 `fetchHistory(tableId, selectedDate)` 재호출
  - `fetchHistory` 내부: `GET /api/order/history?storeId={storeId}&tableId={tableId}&date={date}`
- [x] 14.4 레이아웃 구현
  - 모달 헤더: "테이블 {tableNumber} - 과거 주문 내역" + 닫기(X) 버튼
  - 날짜 필터: `<input type="date">` + "전체 보기" 버튼
  - 주문 목록 테이블: 주문번호, 시각, 메뉴(메뉴명 × 수량), 금액, 상태
  - 빈 상태 메시지:
    - 날짜 필터 없을 때: "과거 주문 내역이 없습니다."
    - 날짜 필터 있을 때: "해당 날짜의 주문 내역이 없습니다."
  - 로딩 스피너 (isLoading=true일 때)
- [x] 14.5 주문 항목 표시
  - 주문별 그룹화: 주문번호, 시각(HH:MM), 메뉴 목록, 총액, 상태
  - 시간 역순 정렬 (서버 정렬 그대로 표시)
  - 금액 포맷: 천 단위 콤마 (예: 8,000원)
- [x] 14.6 `data-testid` 속성 부여
  - `data-testid="order-history-modal"` (모달 래퍼)
  - `data-testid="order-history-title"` (제목)
  - `data-testid="order-history-date-filter"` (날짜 필터 input)
  - `data-testid="order-history-show-all-button"` (전체 보기 버튼)
  - `data-testid="order-history-close-button"` (닫기 버튼)
  - `data-testid="order-history-list"` (주문 목록 영역)
  - `data-testid="order-history-item"` (개별 주문 행)
  - `data-testid="order-history-empty"` (빈 상태 메시지)
  - `data-testid="order-history-loading"` (로딩 스피너)

---

### Step 15: 프론트엔드 유닛 테스트 — US-13, US-14, US-15

> `packages/admin-app/src/__tests__/table/`

- [x] 15.1 `adminTableStore.test.ts` — Store 테스트
  - `fetchTables`: API 호출 후 tables 상태 업데이트 확인
  - `createTable`: 등록 후 tables에 추가 + tableNumber 오름차순 정렬 확인
  - `updateTable`: 수정 후 해당 항목 교체 확인
  - `deleteTable`: 삭제 후 해당 항목 제거 확인
  - `endTableSession`: 세션 종료 후 로컬 상태 업데이트 확인 (isActive=false, currentSessionId=null, sessionStartedAt=null)
  - API 호출 실패 시 error 상태 업데이트 확인
- [x] 15.2 `TableManagementPage.test.tsx` — 페이지 테스트
  - 마운트 시 fetchTables 호출 확인
  - "테이블 추가" 버튼 클릭 시 TableForm 모달 열림 확인
  - TableCard 렌더링 확인 (tables 배열 기반)
  - 삭제 확인 팝업 동작 확인
  - 세션 종료 확인 팝업 동작 확인
- [x] 15.3 `TableCard.test.tsx` — 카드 컴포넌트 테스트
  - isActive=true: "이용 중" 배지, 세션 시작 시각 표시, "이용 완료" 버튼 활성, "삭제" 버튼 비활성
  - isActive=false: "비어 있음" 배지, 세션 시각 미표시, "이용 완료" 버튼 비활성, "삭제" 버튼 활성
  - 각 버튼 클릭 시 올바른 콜백 호출 확인
- [x] 15.4 `TableForm.test.tsx` — 폼 컴포넌트 테스트
  - 등록 모드: 빈 폼, 제목 "테이블 추가", password 필수 검증
  - 수정 모드: 기존 값 초기화, 제목 "테이블 수정", password 선택
  - 유효성 검증 에러 표시 확인
  - submit 시 올바른 데이터 전달 확인
  - API 에러 메시지 표시 확인
- [x] 15.5 `OrderHistoryModal.test.tsx` — 모달 컴포넌트 테스트
  - 마운트 시 전체 주문 로드 확인
  - 날짜 필터 변경 시 재조회 확인
  - "전체 보기" 버튼 클릭 시 날짜 필터 초기화 확인
  - 빈 상태 메시지 표시 확인 (필터 유무에 따른 메시지 분기)
  - 주문 항목 렌더링 확인 (주문번호, 메뉴, 금액, 상태)
  - 로딩 스피너 표시 확인

---

### Step 16: 프론트엔드 코드 요약 문서 — US-13, US-14, US-15

> `aidlc-docs/construction/unit5-table-management/code/frontend-summary.md`

- [x] 16.1 프론트엔드 코드 요약 마크다운 작성
  - 생성된 파일 목록 및 경로
  - 각 컴포넌트의 역할 및 주요 로직 요약
  - 컴포넌트 계층 구조 (TableManagementPage → TableCard, TableForm, OrderHistoryModal)
  - Zustand store 액션 목록 및 상태 구조
  - data-testid 속성 전체 목록 (자동화 테스트 참조용)
  - 라우팅 정보: `/tables` → TableManagementPage
  - 의존성 참조 (Unit 1 auth store, api 인스턴스)
  - 테스트 파일 목록 및 커버리지 범위

---

## 실행 순서 요약

```
Step 1  → 프로젝트 구조 셋업 (파일 생성)
Step 2  → 공유 타입 정의 (shared/types)
Step 3  → TableModel (Mongoose 스키마)
Step 4  → SessionService (세션 종료 로직)
Step 5  → TableController (CRUD + 세션 종료 핸들러)
Step 6  → 테이블 라우트 정의
Step 7  → 과거 주문 조회 엔드포인트
Step 8  → 백엔드 유닛 테스트
Step 9  → 백엔드 코드 요약 문서
Step 10 → AdminStore tables 슬라이스 (Zustand)
Step 11 → TableManagementPage
Step 12 → TableCard
Step 13 → TableForm
Step 14 → OrderHistoryModal
Step 15 → 프론트엔드 유닛 테스트
Step 16 → 프론트엔드 코드 요약 문서
```

## 비즈니스 규칙 → 구현 위치 매핑

| 비즈니스 규칙 | 설명 | 구현 위치 (Step) |
|--------------|------|-----------------|
| BR-TABLE-01 | 테이블 번호 중복 방지 | Step 3 (인덱스), Step 5.2 (등록), Step 5.3 (수정) |
| BR-TABLE-02 | 비밀번호 bcrypt 해싱 + 응답 제외 | Step 3 (toJSON), Step 5.1~5.3 |
| BR-TABLE-03 | 세션 종료 규칙 | Step 4 (SessionService), Step 5.5 |
| BR-TABLE-04 | 활성 세션 테이블 삭제 방지 | Step 5.4, Step 12.3 (UI 비활성화) |
| BR-TABLE-05 | 과거 주문 조회 범위 | Step 7.1 |
| BR-TABLE-06 | 수정 시 비밀번호 변경 규칙 | Step 5.3, Step 13.3 |
| BR-TABLE-07 | 테이블 목록 오름차순 정렬 | Step 5.1, Step 10.1 (createTable 후 재정렬) |
| BR-TABLE-08 | storeId 소유권 검증 | Step 5.1~5.5, Step 7.1 |

## data-testid 전체 목록

| data-testid | 컴포넌트 | 설명 |
|-------------|---------|------|
| `table-management-page` | TableManagementPage | 페이지 래퍼 |
| `add-table-button` | TableManagementPage | 테이블 추가 버튼 |
| `table-grid` | TableManagementPage | 테이블 카드 그리드 |
| `table-card-{tableNumber}` | TableManagementPage | 개별 카드 래퍼 (동적) |
| `table-card` | TableCard | 카드 래퍼 |
| `table-status-badge` | TableCard | 상태 배지 |
| `table-edit-button` | TableCard | 수정 버튼 |
| `table-delete-button` | TableCard | 삭제 버튼 |
| `table-end-session-button` | TableCard | 이용 완료 버튼 |
| `table-view-history-button` | TableCard | 주문 내역 버튼 |
| `table-session-time` | TableCard | 세션 시작 시각 |
| `table-form` | TableForm | 폼 래퍼 |
| `table-form-title` | TableForm | 폼 제목 |
| `table-number-input` | TableForm | 테이블 번호 입력 |
| `table-password-input` | TableForm | 비밀번호 입력 |
| `table-form-error` | TableForm | 에러 메시지 |
| `table-form-cancel-button` | TableForm | 취소 버튼 |
| `table-form-submit-button` | TableForm | 저장 버튼 |
| `order-history-modal` | OrderHistoryModal | 모달 래퍼 |
| `order-history-title` | OrderHistoryModal | 모달 제목 |
| `order-history-date-filter` | OrderHistoryModal | 날짜 필터 |
| `order-history-show-all-button` | OrderHistoryModal | 전체 보기 버튼 |
| `order-history-close-button` | OrderHistoryModal | 닫기 버튼 |
| `order-history-list` | OrderHistoryModal | 주문 목록 영역 |
| `order-history-item` | OrderHistoryModal | 개별 주문 행 |
| `order-history-empty` | OrderHistoryModal | 빈 상태 메시지 |
| `order-history-loading` | OrderHistoryModal | 로딩 스피너 |
