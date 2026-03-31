# Integration Test Instructions - Unit 3

## Purpose
Unit 3 (장바구니&주문)과 다른 유닛 간의 상호작용을 검증합니다.

## 사전 준비

### 1. 서비스 시작
```bash
# MongoDB 시작
mongosh

# 서버 시작
cd packages/server
npm run dev

# 고객앱 시작
cd packages/customer-app
npm run dev
```

### 2. 테스트 데이터 준비
```bash
# MongoDB에 테스트 매장/테이블 데이터 삽입 (Unit 1, 5 연동 후)
```

---

## 통합 테스트 시나리오

### Scenario 1: Unit 1 (인증) → Unit 3 (주문 생성)
- 테이블 로그인 → JWT 토큰 발급 → 주문 생성 API 호출
- 검증: JWT 미들웨어가 sessionId를 올바르게 검증하는지
- 검증: 인증 없이 주문 생성 시 401 반환

### Scenario 2: Unit 2 (메뉴) → Unit 3 (장바구니)
- 메뉴 목록 조회 → 장바구니에 메뉴 추가 → 가격 스냅샷 확인
- 검증: 메뉴 가격 변경 후에도 장바구니 가격 유지 (BR-CART-06)

### Scenario 3: Unit 3 (주문 생성) → Unit 4 (주문 모니터링)
- 주문 생성 → SSE 이벤트 발생 → 관리자 대시보드 수신
- 검증: 주문 생성 시 SSEService.broadcast 호출

### Scenario 4: Unit 5 (세션 종료) → Unit 3 (주문 조회)
- 세션 종료 후 해당 sessionId의 주문이 과거 이력으로 분류
- 검증: 새 세션에서 이전 세션 주문이 조회되지 않음 (BR-QUERY-01)

---

## 수동 통합 테스트 (curl)

### 주문 생성 테스트
```bash
curl -X POST http://localhost:3000/api/order/create \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "store1",
    "tableId": "table1",
    "sessionId": "test-session-1",
    "items": [{"menuName": "김치찌개", "quantity": 2, "unitPrice": 8000}],
    "totalAmount": 16000
  }'
```

### 주문 목록 조회 테스트
```bash
curl "http://localhost:3000/api/order/list?storeId=store1&sessionId=test-session-1"
```

## 참고
- 전체 통합 테스트는 모든 유닛 코드 생성 완료 후 실행 가능
- 현재 Unit 3 단독으로는 JWT 미들웨어 없이 API 직접 호출로 테스트
