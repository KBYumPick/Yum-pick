# 단위 테스트 실행 지침 (Unit Test Instructions)

냠픽(Yumpick) 테이블 오더 서비스 — 단위 테스트 가이드

---

## 1. 테스트 개요

| 패키지 | 테스트 파일 수 | 테스트 케이스 수 | 프레임워크 |
|--------|---------------|-----------------|-----------|
| `packages/server` | 6개 | 51개 | Jest |
| `packages/admin-app` | 5개 | 38개 | Jest + React Testing Library |
| `packages/customer-app` | 1개 | 9개 | Vitest |
| **합계** | **12개** | **98개** | - |

---

## 2. 전체 테스트 실행

```bash
# 모노레포 루트에서 실행
npm test --workspaces
```

---

## 3. 백엔드 단위 테스트 (`packages/server`)

```bash
cd packages/server
npm test
```

### Unit 5 - 테이블 관리 (38 tests)

- `TableModel.test.ts` (11): 스키마 검증, 기본값, toJSON transform, 복합 인덱스
- `SessionService.test.ts` (3): 세션 종료 로직, 에러 케이스
- `TableController.test.ts` (17): listTables, createTable, updateTable, deleteTable, endSession
- `OrderHistoryController.test.ts` (8): 과거 주문 조회, 날짜 필터, 세션 제외 로직

### Unit 3 - 장바구니&주문 (13 tests)

- `orderController.test.js` (8): createOrder 201/400, listOrders 필터링, getOrder 200/404
- `orderTypes.test.js` (5): OrderStatus 값 검증, 상태 전이, 주문번호 형식

---

## 4. 프론트엔드 단위 테스트 - admin-app (`packages/admin-app`)

```bash
cd packages/admin-app
npm test
```

### Unit 5 - 테이블 관리 (38 tests)

- `adminTableStore.test.ts` (10): Zustand 스토어 5개 액션
- `TableManagementPage.test.tsx` (7): 페이지 마운트, 목록 렌더링, 모달
- `TableCard.test.tsx` (8): 활성/비활성 상태 UI, 버튼 콜백
- `TableForm.test.tsx` (8): 등록/수정 모드, 유효성 검증, 제출
- `OrderHistoryModal.test.tsx` (8): 주문 내역 fetch, 날짜 필터, 빈 상태

---

## 5. 프론트엔드 단위 테스트 - customer-app (`packages/customer-app`)

```bash
cd packages/customer-app
npx vitest --run
```

### Unit 3 - 장바구니 (9 tests)

- `cartStore.test.ts` (9): addToCart, updateQuantity (BR-CART-01~03), removeFromCart, clearCart (BR-CART-05), localStorage 동기화 (BR-CART-04)

---

## 6. 커버리지 리포트

```bash
# 서버
cd packages/server && npm test -- --coverage --watchAll=false

# 관리자 앱
cd packages/admin-app && npm test -- --coverage --watchAll=false

# 고객 앱
cd packages/customer-app && npx vitest --run --coverage
```

---

## 7. 예상 결과

```
Test Suites: 12 passed, 12 total
Tests:       98 passed, 0 failed, 0 total
```
