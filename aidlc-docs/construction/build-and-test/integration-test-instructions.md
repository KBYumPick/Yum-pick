# 통합 테스트 지침 (Integration Test Instructions)

냠픽(Yumpick) 테이블 오더 서비스 — 유닛 간 통합 테스트 가이드

---

## 1. 개요

| 시나리오 | 관련 유닛 | 검증 내용 |
|---------|-----------|-----------|
| 시나리오 1 | Unit1 + Unit2 + Unit3 | 테이블 로그인 → 메뉴 조회 → 주문 생성 |
| 시나리오 2 | Unit3 + Unit4 | 주문 생성 → SSE 실시간 알림 → 관리자 상태 변경 |
| 시나리오 3 | Unit5 + Unit3 | 테이블 세션 종료 → 과거 주문 조회 |
| 시나리오 4 | Unit1 + Unit5 | 관리자 로그인 → 테이블 CRUD → 세션 관리 |

---

## 2. 테스트 환경 설정

```bash
# 테스트 전용 DB
MONGODB_URI=mongodb://localhost:27017/yumpick_test
JWT_SECRET=test-secret-key
PORT=3000
```

```bash
# 서버 시작
cd packages/server && npm run dev

# 헬스체크
curl http://localhost:3000/health
```

---

## 3. 시나리오 1: 테이블 로그인 → 메뉴 조회 → 주문 생성

관련 유닛: Unit1(인증) + Unit2(메뉴) + Unit3(장바구니&주문)

```bash
BASE_URL="http://localhost:3000/api"

# 관리자 로그인
ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"storeId": "store-test-001", "password": "admin1234"}' | jq -r '.token')

# 테이블 생성
TABLE_RESPONSE=$(curl -s -X POST $BASE_URL/table/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"storeId": "store-test-001", "tableNumber": 1, "password": "table1234"}')
TABLE_ID=$(echo $TABLE_RESPONSE | jq -r '._id')

# 테이블 로그인 (고객)
CUSTOMER_TOKEN=$(curl -s -X POST $BASE_URL/auth/table/login \
  -H "Content-Type: application/json" \
  -d '{"storeId": "store-test-001", "tableNumber": 1, "password": "table1234"}' | jq -r '.token')

# 주문 생성
curl -X POST $BASE_URL/order/create \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "store-test-001",
    "tableId": "'"$TABLE_ID"'",
    "sessionId": "test-session-1",
    "items": [{"menuName": "김치찌개", "quantity": 2, "unitPrice": 8000}],
    "totalAmount": 16000
  }'
# 예상: 201 Created
```

---

## 4. 시나리오 2: 주문 생성 → SSE 알림 → 관리자 상태 변경

관련 유닛: Unit3(장바구니&주문) + Unit4(주문모니터링)

```bash
# SSE 연결 (터미널 1)
curl -N -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/sse?storeId=store-test-001" &

# 주문 생성 (터미널 2) - SSE 이벤트 2초 이내 수신 확인
curl -X POST $BASE_URL/order/create \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "store-test-001",
    "tableId": "'"$TABLE_ID"'",
    "sessionId": "test-session-1",
    "items": [{"menuName": "된장찌개", "quantity": 1, "unitPrice": 7000}],
    "totalAmount": 7000
  }'
```

---

## 5. 시나리오 3: 테이블 세션 종료 → 과거 주문 조회

관련 유닛: Unit5(테이블관리) + Unit3(장바구니&주문)

```bash
# 세션 종료
curl -X POST $BASE_URL/table/end-session/$TABLE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 과거 주문 조회 (현재 세션 주문 제외 확인 - BR-TABLE-05)
curl "$BASE_URL/order/list?storeId=store-test-001&sessionId=test-session-1"
```

---

## 6. 시나리오 4: 관리자 로그인 → 테이블 CRUD → 세션 관리

관련 유닛: Unit1(인증) + Unit5(테이블관리)

```bash
# 테이블 목록 조회 (tableNumber 오름차순 - BR-TABLE-07)
curl "$BASE_URL/table/list?storeId=store-test-001" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 중복 테이블 번호 생성 시도 (BR-TABLE-01)
curl -X POST $BASE_URL/table/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"storeId": "store-test-001", "tableNumber": 1, "password": "pw1234"}'
# 예상: 400 Bad Request

# 활성 테이블 삭제 시도 (BR-TABLE-04)
curl -X DELETE $BASE_URL/table/delete/$TABLE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# 예상: 400 Bad Request
```

---

## 7. 정리 (Cleanup)

```bash
mongosh mongodb://localhost:27017/yumpick_test --eval "db.dropDatabase()"
```

---

## 참고
- 전체 통합 테스트는 모든 유닛 코드 생성 완료 후 실행 가능
- 현재 Unit 3 단독으로는 JWT 미들웨어 없이 API 직접 호출로 테스트
