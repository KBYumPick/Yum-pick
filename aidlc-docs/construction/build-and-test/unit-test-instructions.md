# Unit Test Execution - Unit 3

## 백엔드 테스트

### 실행
```bash
cd packages/server
npm test
```

### 테스트 목록 (13 tests)
- Order Types: OrderStatus 값 검증, 상태 전이 단방향 검증, 역방향 전이 불가 검증
- Order Number Format: YYYYMMDD-NNN 형식 검증, 3자리 패딩 검증
- createOrder: 정상 생성 201, 빈 items 400, totalAmount 불일치 400, 수량 범위 초과 400, sessionId 불일치 401
- listOrders: 쿼리 파라미터 필터링
- getOrder: 존재하는 주문 반환, 미존재 주문 404

### 결과
- Total: 13 tests, 2 suites
- Passed: 13
- Failed: 0

---

## 프론트엔드 테스트

### 실행
```bash
cd packages/customer-app
npx vitest --run
```

### 테스트 목록 (9 tests)
- addToCart: 새 메뉴 추가, 동일 메뉴 수량 +1 (BR-CART-03), 수량 99 초과 방지 (BR-CART-01)
- updateQuantity: 수량 변경, 0 이하 시 삭제 (BR-CART-02), 99 초과 클램핑 (BR-CART-01)
- removeFromCart: 항목 삭제
- clearCart: 장바구니 비우기 (BR-CART-05)
- localStorage 동기화 (BR-CART-04)

### 결과
- Total: 9 tests, 1 suite
- Passed: 9
- Failed: 0
