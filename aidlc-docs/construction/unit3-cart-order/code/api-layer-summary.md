# API Layer Summary - Unit 3

## 파일
- `packages/server/src/controllers/orderController.js`
- `packages/server/src/routes/orderRoutes.js`

## 엔드포인트

| Method | Route | 설명 | Story |
|--------|-------|------|-------|
| POST | /api/order/create | 주문 생성 | US-07 |
| GET | /api/order/list | 주문 목록 조회 | US-08 |
| GET | /api/order/detail/:id | 주문 상세 조회 | US-08 |

## 검증 로직
- BR-ORDER-01: 빈 items 배열 → 400
- BR-ORDER-02: totalAmount 서버 재계산 불일치 → 400
- BR-ORDER-03: 수량 범위 (1~99) 위반 → 400
- BR-ORDER-04: sessionId 불일치 → 401

## 참고
- updateStatus, deleteOrder, listHistory는 Unit 4, Unit 5 범위
