# Order Model Summary - Unit 3

## 파일
- `packages/server/src/models/Order.js`
- `packages/server/src/types/order.types.js`

## Mongoose 스키마
- **Order**: storeId, tableId, sessionId, orderNumber, items[], totalAmount, status, timestamps
- **OrderItem** (서브도큐먼트): menuName, quantity (1~99), unitPrice

## 인덱스
- `{ storeId, sessionId }` - 세션별 조회
- `{ storeId, tableId, createdAt: -1 }` - 테이블별 조회
- `{ storeId, orderNumber }` - unique, 중복 방지

## Static Methods
- `generateOrderNumber(storeId)` → `YYYYMMDD-NNN` 형식 주문번호 생성
- `isValidTransition(current, next)` → 단방향 상태 전이 검증

## Stories: US-07, US-08
