# 통합 테스트 지침 (Integration Test Instructions)

냠픽(Yumpick) 테이블 오더 서비스 — 유닛 간 통합 테스트 가이드

---

## 1. 개요

5개 유닛 간의 상호작용을 검증하는 4가지 핵심 시나리오를 다룹니다.

| 시나리오 | 관련 유닛 | 검증 내용 |
|---------|-----------|-----------|
| 시나리오 1 | Unit1 + Unit2 + Unit3 | 테이블 로그인 → 메뉴 조회 → 주문 생성 |
| 시나리오 2 | Unit3 + Unit4 | 주문 생성 → SSE 실시간 알림 → 관리자 상태 변경 |
| 시나리오 3 | Unit5 + Unit3 | 테이블 세션 종료 → 과거 주문 조회 |
| 시나리오 4 | Unit1 + Unit5 | 관리자 로그인 → 테이블 CRUD → 세션 관리 |

---

## 2. 테스트 환경 설정

### 2.1 MongoDB 테스트 DB 준비

```bash
# 테스트 전용 DB 사용 (운영 DB와 분리)
# packages/server/.env.test 파일 생성
cat > packages/server/.env.test << EOF
MONGODB_URI=mongodb://localhost:27017/yumpick_test
JWT_SECRET=test-secret-key-for-integration-tests
PORT=4001
EOF
```

### 2.2 서버 시작

```bash
# 테스트용 서버 시작 (포트 4001)
cd packages/server
NODE_ENV=test PORT=4001 npm run dev
```

서버 준비 확인:

```bash
curl http://localhost:4001/health
# 예상 응답: {"status":"ok"}
```

### 2.3 테스트 데이터 초기화

```bash
# MongoDB 테스트 DB 초기화
mongosh mongodb://localhost:27017/yumpick_test --eval "db.dropDatabase()"
```

### 2.4 공통 변수 설정

아래 테스트 전반에서 사용할 변수들입니다. 실제 응답값으로 교체하세요.

```bash
BASE_URL="http://localhost:4001/api"
STORE_ID="store-test-001"
ADMIN_TOKEN=""      # 시나리오 실행 중 획득
CUSTOMER_TOKEN=""   # 시나리오 실행 중 획득
TABLE_ID=""         # 시나리오 실행 중 획득
```

---

## 3. 시나리오 1: 테이블 로그인 → 메뉴 조회 → 주문 생성

**관련 유닛**: Unit1(인증) + Unit2(메뉴) + Unit3(장바구니&주문)

**목적**: 고객이 테이블에서 QR 코드로 접속하여 메뉴를 조회하고 주문을 완료하는 전체 흐름 검증

### Step 1: 관리자 계정 생성 및 로그인

```bash
# 1-1. 관리자 회원가입
curl -X POST $BASE_URL/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "store-test-001",
    "password": "admin1234",
    "storeName": "테스트 매장"
  }'
# 예상: 201 Created

# 1-2. 관리자 로그인
ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "store-test-001",
    "password": "admin1234"
  }' | jq -r '.token')

echo "Admin Token: $ADMIN_TOKEN"
# 예상: JWT 토큰 문자열
```

### Step 2: 테이블 생성

```bash
# 2-1. 테이블 생성 (관리자 권한)
TABLE_RESPONSE=$(curl -s -X POST $BASE_URL/table/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "storeId": "store-test-001",
    "tableNumber": 1,
    "password": "table1234"
  }')

TABLE_ID=$(echo $TABLE_RESPONSE | jq -r '._id')
echo "Table ID: $TABLE_ID"
# 예상: 201 Created, MongoDB ObjectId
```

### Step 3: 테이블 로그인 (고객)

```bash
# 3-1. 테이블 로그인
CUSTOMER_TOKEN=$(curl -s -X POST $BASE_URL/auth/table/login \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "store-test-001",
    "tableNumber": 1,
    "password": "table1234"
  }' | jq -r '.token')

echo "Customer Token: $CUSTOMER_TOKEN"
# 예상: JWT 토큰 (tableId, storeId, role: "customer" 포함)
```

### Step 4: 메뉴 조회

```bash
# 4-1. 메뉴 목록 조회 (고객 토큰 사용)
curl -X GET "$BASE_URL/menu/list?storeId=store-test-001" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
# 예상: 200 OK, 메뉴 배열 (초기에는 빈 배열 또는 사전 등록된 메뉴)
```

### Step 5: 주문 생성

```bash
# 5-1. 주문 생성
ORDER_RESPONSE=$(curl -s -X POST $BASE_URL/order/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "storeId": "store-test-001",
    "tableId": "'"$TABLE_ID"'",
    "items": [
      {"menuId": "menu-001", "menuName": "김치찌개", "quantity": 2, "unitPrice": 8000},
      {"menuId": "menu-002", "menuName": "공기밥", "quantity": 2, "unitPrice": 1000}
    ]
  }')

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '._id')
echo "Order ID: $ORDER_ID"
# 예상: 201 Created, 주문 객체 (status: "pending")
```

**예상 결과**:
- 관리자 로그인 성공 → JWT 토큰 발급
- 테이블 생성 성공 → isActive: false 상태
- 테이블 로그인 성공 → 고객 JWT 토큰 발급, 테이블 isActive: true 전환
- 메뉴 조회 성공 → 200 OK
- 주문 생성 성공 → 201 Created, status: "pending"

---

## 4. 시나리오 2: 주문 생성 → SSE 실시간 알림 → 관리자 상태 변경

**관련 유닛**: Unit3(장바구니&주문) + Unit4(주문모니터링)

**목적**: 주문 생성 시 SSE를 통해 관리자에게 2초 이내 알림이 전달되고, 관리자가 주문 상태를 변경하는 흐름 검증

### Step 1: SSE 연결 수립 (관리자)

```bash
# 터미널 1: SSE 연결 (백그라운드 실행)
curl -N -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/orders/sse?storeId=store-test-001" &
SSE_PID=$!
echo "SSE PID: $SSE_PID"
# 예상: 연결 유지, "data: connected" 이벤트 수신
```

### Step 2: 주문 생성 (고객) — SSE 알림 트리거

```bash
# 터미널 2: 주문 생성 (시나리오 1의 Step 5 참조)
# 주문 생성 시각 기록
ORDER_TIME=$(date +%s%3N)

curl -s -X POST $BASE_URL/order/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "storeId": "store-test-001",
    "tableId": "'"$TABLE_ID"'",
    "items": [{"menuId": "menu-001", "menuName": "된장찌개", "quantity": 1, "unitPrice": 7000}]
  }'
# 예상: 201 Created
```

### Step 3: SSE 알림 수신 확인

터미널 1에서 SSE 이벤트 수신 확인:

```
data: {"type":"NEW_ORDER","orderId":"...","tableNumber":1,"totalAmount":7000}
```

알림 지연 시간 측정:
- 주문 생성 시각과 SSE 이벤트 수신 시각의 차이가 **2초 이내**여야 합니다 (NFR-01).

### Step 4: 관리자 주문 상태 변경

```bash
# 4-1. 주문 상태를 "preparing"으로 변경
curl -X PATCH $BASE_URL/order/status/$ORDER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "preparing"}'
# 예상: 200 OK, status: "preparing"

# 4-2. 주문 상태를 "completed"로 변경
curl -X PATCH $BASE_URL/order/status/$ORDER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "completed"}'
# 예상: 200 OK, status: "completed"
```

### Step 5: SSE 연결 종료

```bash
kill $SSE_PID
```

**예상 결과**:
- SSE 연결 수립 성공 → 연결 유지 상태
- 주문 생성 후 2초 이내 SSE 이벤트 수신 (NFR-01 충족)
- 주문 상태 변경 성공 → 각 상태로 정상 전환

---

## 5. 시나리오 3: 테이블 세션 종료 → 과거 주문 조회

**관련 유닛**: Unit5(테이블관리) + Unit3(장바구니&주문)

**목적**: 관리자가 테이블 세션을 종료한 후, 해당 테이블의 과거 주문 내역이 올바르게 조회되는지 검증

### 사전 조건

시나리오 1이 완료된 상태 (테이블 활성, 주문 존재)

### Step 1: 현재 세션 주문 확인

```bash
# 세션 종료 전 현재 주문 조회 (현재 세션 주문은 과거 내역에서 제외되어야 함)
curl -X GET "$BASE_URL/order/history?storeId=store-test-001&tableId=$TABLE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# 예상: 200 OK, 현재 세션 주문이 제외된 빈 배열 또는 이전 세션 주문만 포함
```

### Step 2: 테이블 세션 종료

```bash
# 관리자가 테이블 세션 종료
curl -X POST $BASE_URL/table/end-session/$TABLE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# 예상: 200 OK, {"success": true}
# 테이블 상태: isActive: false, currentSessionId: null
```

### Step 3: 세션 종료 후 테이블 상태 확인

```bash
curl -X GET "$BASE_URL/table/list?storeId=store-test-001" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# 예상: tableNumber 1의 isActive: false, currentSessionId: null
```

### Step 4: 과거 주문 내역 조회

```bash
# 세션 종료 후 전체 주문 내역 조회
curl -X GET "$BASE_URL/order/history?storeId=store-test-001&tableId=$TABLE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# 예상: 200 OK, 방금 종료된 세션의 주문들이 포함된 배열 (createdAt 내림차순)
```

### Step 5: 날짜 필터 조회

```bash
TODAY=$(date +%Y-%m-%d)

curl -X GET "$BASE_URL/order/history?storeId=store-test-001&tableId=$TABLE_ID&date=$TODAY" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# 예상: 200 OK, 오늘 날짜의 주문만 포함
```

**예상 결과**:
- 세션 종료 전: 현재 세션 주문이 과거 내역에서 제외됨 (BR-TABLE-05)
- 세션 종료 성공: isActive: false, currentSessionId: null
- 세션 종료 후: 종료된 세션의 주문이 과거 내역에 포함됨
- 날짜 필터: 해당 날짜 범위의 주문만 반환

---

## 6. 시나리오 4: 관리자 로그인 → 테이블 CRUD → 세션 관리

**관련 유닛**: Unit1(인증) + Unit5(테이블관리)

**목적**: 관리자 인증 후 테이블 생성/수정/삭제 및 세션 관리 전체 흐름 검증

### Step 1: 관리자 로그인 (시나리오 1 Step 1 참조)

```bash
ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"storeId": "store-test-001", "password": "admin1234"}' \
  | jq -r '.token')
```

### Step 2: 테이블 목록 조회

```bash
curl -X GET "$BASE_URL/table/list?storeId=store-test-001" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# 예상: 200 OK, tableNumber 오름차순 정렬된 배열 (BR-TABLE-07)
```

### Step 3: 테이블 생성

```bash
# 테이블 2번 생성
T2_RESPONSE=$(curl -s -X POST $BASE_URL/table/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"storeId": "store-test-001", "tableNumber": 2, "password": "pw2222"}')

T2_ID=$(echo $T2_RESPONSE | jq -r '._id')
# 예상: 201 Created, isActive: false

# 중복 테이블 번호 생성 시도 (실패 케이스)
curl -X POST $BASE_URL/table/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"storeId": "store-test-001", "tableNumber": 2, "password": "pw2222"}'
# 예상: 400 Bad Request, "이미 존재하는 테이블 번호입니다." (BR-TABLE-01)
```

### Step 4: 테이블 수정

```bash
# 테이블 번호 변경 (2 → 5)
curl -X PUT $BASE_URL/table/update/$T2_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"tableNumber": 5, "password": ""}'
# 예상: 200 OK, tableNumber: 5, 비밀번호 변경 없음 (BR-TABLE-06)
```

### Step 5: 활성 테이블 삭제 시도 (실패 케이스)

```bash
# 먼저 테이블 5번에 고객 로그인하여 활성화
curl -X POST $BASE_URL/auth/table/login \
  -H "Content-Type: application/json" \
  -d '{"storeId": "store-test-001", "tableNumber": 5, "password": "pw2222"}'
# 예상: 200 OK, 테이블 isActive: true

# 활성 테이블 삭제 시도
curl -X DELETE $BASE_URL/table/delete/$T2_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# 예상: 400 Bad Request, "이용 중인 테이블은 삭제할 수 없습니다" (BR-TABLE-04)
```

### Step 6: 세션 종료 후 테이블 삭제

```bash
# 세션 종료
curl -X POST $BASE_URL/table/end-session/$T2_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# 예상: 200 OK, {"success": true}

# 비활성 테이블 삭제
curl -X DELETE $BASE_URL/table/delete/$T2_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# 예상: 200 OK, {"success": true}
```

### Step 7: 타 매장 테이블 접근 시도 (보안 검증)

```bash
# 다른 storeId로 테이블 목록 조회 시도
curl -X GET "$BASE_URL/table/list?storeId=other-store-999" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# 예상: 403 Forbidden (BR-TABLE-08)
```

**예상 결과**:
- 관리자 로그인 성공 → JWT 토큰 발급
- 테이블 목록 조회 → tableNumber 오름차순 정렬
- 테이블 생성 성공 → 201 Created
- 중복 테이블 번호 → 400 Bad Request
- 테이블 수정 성공 → 200 OK, 비밀번호 미변경 시 기존 유지
- 활성 테이블 삭제 시도 → 400 Bad Request
- 세션 종료 후 삭제 → 200 OK
- 타 매장 접근 → 403 Forbidden

---

## 7. 정리 (Cleanup)

모든 시나리오 완료 후 테스트 데이터를 정리합니다.

```bash
# 테스트 DB 전체 삭제
mongosh mongodb://localhost:27017/yumpick_test --eval "db.dropDatabase()"

# 테스트 서버 종료
# Ctrl+C 또는 프로세스 종료
pkill -f "NODE_ENV=test"
```

---

## 8. Postman 컬렉션 사용 (선택사항)

위 curl 명령을 Postman 컬렉션으로 가져오려면:

1. Postman에서 "Import" 클릭
2. "Raw text" 탭에서 curl 명령 붙여넣기
3. 환경 변수 설정: `BASE_URL`, `ADMIN_TOKEN`, `CUSTOMER_TOKEN`, `TABLE_ID`

환경 변수 파일 예시 (`postman-env.json`):

```json
{
  "id": "yumpick-test-env",
  "name": "Yumpick Test",
  "values": [
    {"key": "BASE_URL", "value": "http://localhost:4001/api"},
    {"key": "ADMIN_TOKEN", "value": ""},
    {"key": "CUSTOMER_TOKEN", "value": ""},
    {"key": "TABLE_ID", "value": ""}
  ]
}
```
