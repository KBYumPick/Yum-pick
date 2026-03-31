# Code Generation Plan - Unit 3: 장바구니&주문 (유진)

## Unit Context

- **담당**: 유진
- **범위**: 장바구니 + 주문 생성 + 주문 내역 조회 (고객앱)
- **User Stories**: US-05, US-06, US-07, US-08
- **프로젝트 타입**: Greenfield Monorepo
- **코드 위치**: `packages/` 하위

## Dependencies

- **Unit 1 (인증)**: JWT 미들웨어, 세션 정보 (token, sessionId, tableId, storeId)
- **Unit 2 (메뉴)**: Menu 타입, MenuPage에서 장바구니 추가 버튼 연동
- **Unit 4 (주문모니터링)**: OrderController의 updateStatus, deleteOrder는 Unit 4 범위
- **Unit 5 (테이블관리)**: sessionId 기반 주문 그룹화

## Story Traceability

| Story | 설명 | 구현 범위 |
|-------|------|----------|
| US-05 | 장바구니에 메뉴 추가 | addToCart, CartBadge, CartComponent |
| US-06 | 장바구니 수정 | updateQuantity, removeFromCart, clearCart, localStorage 동기화 |
| US-07 | 주문 생성 | createOrder API, OrderConfirmModal, 주문번호 생성 |
| US-08 | 주문 내역 조회 | listOrders/getOrder API, OrderHistoryPage, OrderCard |

---

## Plan Steps

### Step 1: 프로젝트 구조 셋업 (Greenfield) ✅
- [x] `packages/server/` 디렉토리 구조 생성 (controllers, models, routes, middleware, services)
- [x] `packages/customer-app/` 디렉토리 구조 생성 (pages, components, stores, services)
- [x] `packages/server/package.json` 생성 (Express, Mongoose, jsonwebtoken, cors, dotenv)
- [x] `packages/customer-app/package.json` 생성 (React, Zustand, React Router, Axios)
- [x] 루트 `package.json` (workspaces 설정)
- [x] **Stories**: 전체 기반

### Step 2: 공통 타입 정의 ✅
- [x] `packages/server/src/types/order.types.js` - 백엔드 주문 관련 상수/열거형 (JSDoc 활용)
- [x] `packages/customer-app/src/types/order.ts` - 프론트엔드 CartItem, Order, OrderItem, OrderStatus 타입
- [x] **Stories**: US-05, US-06, US-07, US-08

### Step 3: 백엔드 - OrderModel (비즈니스 로직 레이어) ✅
- [x] `packages/server/src/models/Order.js` - Mongoose 스키마 + 인덱스 정의
- [x] 주문 번호 생성 로직 (generateOrderNumber)
- [x] 상태 전이 검증 로직
- [x] **Stories**: US-07, US-08

### Step 4: 백엔드 - OrderModel 유닛 테스트 ✅
- [x] `packages/server/src/models/__tests__/Order.test.js` - 스키마 검증, 주문번호 생성, 상태 전이 테스트
- [x] **Stories**: US-07, US-08

### Step 5: 백엔드 - OrderModel 요약 문서 ✅
- [x] `aidlc-docs/construction/unit3-cart-order/code/order-model-summary.md`
- [x] **Stories**: US-07, US-08

### Step 6: 백엔드 - OrderController (API 레이어) ✅
- [x] `packages/server/src/controllers/orderController.js` - createOrder, listOrders, getOrder
- [x] 요청 검증 (items 비어있는지, totalAmount 서버 재계산, 수량 범위, sessionId 일치)
- [x] **Stories**: US-07, US-08

### Step 7: 백엔드 - Order 라우트 ✅
- [x] `packages/server/src/routes/orderRoutes.js` - POST /create, GET /list, GET /detail/:id
- [x] **Stories**: US-07, US-08

### Step 8: 백엔드 - OrderController 유닛 테스트 ✅
- [x] `packages/server/src/controllers/__tests__/orderController.test.js`
- [x] createOrder 성공/실패 케이스, listOrders, getOrder 테스트
- [x] **Stories**: US-07, US-08

### Step 9: 백엔드 - API 레이어 요약 문서 ✅
- [x] `aidlc-docs/construction/unit3-cart-order/code/api-layer-summary.md`
- [x] **Stories**: US-07, US-08

### Step 10: 프론트엔드 - CustomerStore (cart/order 슬라이스) ✅
- [x] `packages/customer-app/src/stores/customerStore.ts` - Zustand store
- [x] 장바구니 액션: addToCart, removeFromCart, updateQuantity, clearCart
- [x] localStorage 동기화 로직
- [x] 주문 액션: createOrder, fetchOrders
- [x] **Stories**: US-05, US-06, US-07, US-08

### Step 11: 프론트엔드 - Order API 서비스 ✅
- [x] `packages/customer-app/src/services/orderApi.ts` - Axios 기반 API 클라이언트
- [x] createOrder, listOrders, getOrder 함수
- [x] **Stories**: US-07, US-08

### Step 12: 프론트엔드 - CartComponent, CartItemRow, CartBadge ✅
- [x] `packages/customer-app/src/components/CartBadge.tsx` - 메뉴 화면 하단 장바구니 버튼
- [x] `packages/customer-app/src/components/CartComponent.tsx` - 장바구니 패널
- [x] `packages/customer-app/src/components/CartItemRow.tsx` - 개별 항목 행
- [x] data-testid 속성 포함
- [x] **Stories**: US-05, US-06

### Step 13: 프론트엔드 - OrderConfirmModal ✅
- [x] `packages/customer-app/src/components/OrderConfirmModal.tsx` - 주문 확인/성공 모달
- [x] 주문 확정 플로우, 5초 카운트다운, 에러 처리
- [x] data-testid 속성 포함
- [x] **Stories**: US-07

### Step 14: 프론트엔드 - OrderHistoryPage, OrderCard ✅
- [x] `packages/customer-app/src/pages/OrderHistoryPage.tsx` - 주문 내역 페이지
- [x] `packages/customer-app/src/components/OrderCard.tsx` - 개별 주문 카드
- [x] data-testid 속성 포함
- [x] **Stories**: US-08

### Step 15: 프론트엔드 컴포넌트 유닛 테스트 ✅
- [x] `packages/customer-app/src/stores/__tests__/customerStore.test.ts` - store 액션 테스트
- [x] **Stories**: US-05, US-06, US-07, US-08

### Step 16: 프론트엔드 컴포넌트 요약 문서 ✅
- [x] `aidlc-docs/construction/unit3-cart-order/code/frontend-components-summary.md`
- [x] **Stories**: US-05, US-06, US-07, US-08

### Step 17: 라우팅 및 앱 통합 ✅
- [x] `packages/customer-app/src/App.tsx` - React Router 설정 (/menu, /orders)
- [x] 백엔드 `packages/server/src/app.js` - Express 앱 설정 (orderRoutes 등록)
- [x] **Stories**: 전체

---

## 총 17 Steps | 생성 파일 약 20개 | Stories: US-05, US-06, US-07, US-08
