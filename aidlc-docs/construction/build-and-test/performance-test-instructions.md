# 성능 테스트 지침 (Performance Test Instructions)

냠픽(Yumpick) 테이블 오더 서비스 — 성능 테스트 가이드

---

## 1. 성능 요구사항 (NFR)

| NFR ID | 항목 | 목표값 | 측정 방법 |
|--------|------|--------|-----------|
| NFR-01 | SSE 주문 알림 전달 지연 | **2초 이내** | 주문 생성 ~ SSE 이벤트 수신 시간 차 |
| NFR-02 | API 응답 시간 | **500ms 이내** (p95) | k6 http_req_duration |
| NFR-03 | 동시 주문 처리 | 10명 동시 주문 | k6 VU 10 부하 테스트 |
| NFR-04 | SSE 동시 연결 | 5개 관리자 연결 유지 | k6 SSE 연결 테스트 |

---

## 2. 테스트 도구 설치

### 2.1 k6 설치 (권장)

```bash
# macOS
brew install k6

# Linux (Ubuntu/Debian)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# 버전 확인
k6 version
```

### 2.2 Artillery 설치 (대안)

```bash
# npm으로 전역 설치
npm install -g artillery

# 버전 확인
artillery version
```

---

## 3. 테스트 환경 준비

```bash
# 성능 테스트용 서버 시작 (운영과 동일한 설정)
cd packages/server
NODE_ENV=perf PORT=4000 npm run dev

# 사전 데이터 준비 스크립트 실행
# (관리자 계정, 테이블 10개, 메뉴 데이터 생성)
node scripts/seed-perf-data.js
```

사전 데이터 시드 스크립트 예시 (`packages/server/scripts/seed-perf-data.js`):

```javascript
const BASE_URL = 'http://localhost:4000/api';

async function seed() {
  // 1. 관리자 등록
  await fetch(`${BASE_URL}/auth/admin/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId: 'perf-store', password: 'perf1234', storeName: '성능테스트매장' })
  });

  // 2. 관리자 로그인 → 토큰 획득
  const loginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId: 'perf-store', password: 'perf1234' })
  });
  const { token } = await loginRes.json();

  // 3. 테이블 10개 생성
  for (let i = 1; i <= 10; i++) {
    await fetch(`${BASE_URL}/table/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ storeId: 'perf-store', tableNumber: i, password: `table${i}pw` })
    });
  }
  console.log('시드 데이터 생성 완료');
}

seed().catch(console.error);
```

---

## 4. 시나리오 1: 동시 주문 생성 (10명 동시 고객)

**목적**: 10명의 고객이 동시에 주문을 생성할 때 API 응답 시간이 500ms 이내인지 검증

### k6 스크립트 (`perf-tests/concurrent-orders.js`)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const orderDuration = new Trend('order_duration');
const orderSuccess = new Rate('order_success_rate');

export const options = {
  vus: 10,           // 동시 가상 사용자 10명
  duration: '30s',   // 30초간 실행
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // 95%ile 응답 500ms 이내
    'order_success_rate': ['rate>0.99'], // 성공률 99% 이상
  },
};

const BASE_URL = 'http://localhost:4000/api';

// 사전에 획득한 고객 토큰 배열 (각 테이블별)
const CUSTOMER_TOKENS = [
  // 실제 테스트 전 테이블 로그인으로 획득한 토큰들
  __ENV.TOKEN_1 || 'token-placeholder-1',
  __ENV.TOKEN_2 || 'token-placeholder-2',
  // ... 10개
];

const TABLE_IDS = [
  __ENV.TABLE_ID_1 || 'table-id-1',
  // ... 10개
];

export default function () {
  const vuIndex = (__VU - 1) % 10;
  const token = CUSTOMER_TOKENS[vuIndex];
  const tableId = TABLE_IDS[vuIndex];

  const payload = JSON.stringify({
    storeId: 'perf-store',
    tableId: tableId,
    items: [
      { menuId: 'menu-001', menuName: '김치찌개', quantity: 1, unitPrice: 8000 }
    ]
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  const start = Date.now();
  const res = http.post(`${BASE_URL}/order/create`, payload, params);
  const duration = Date.now() - start;

  orderDuration.add(duration);
  orderSuccess.add(res.status === 201);

  check(res, {
    '주문 생성 성공 (201)': (r) => r.status === 201,
    '응답 시간 500ms 이내': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### 실행

```bash
# 스크립트 실행
k6 run perf-tests/concurrent-orders.js

# 환경 변수와 함께 실행
k6 run \
  -e TOKEN_1=<token1> \
  -e TABLE_ID_1=<tableId1> \
  perf-tests/concurrent-orders.js
```

---

## 5. 시나리오 2: SSE 연결 유지 (5개 관리자 연결)

**목적**: 5개의 SSE 연결이 동시에 유지되는 상태에서 주문 알림이 2초 이내 전달되는지 검증

### k6 스크립트 (`perf-tests/sse-connections.js`)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const sseEventsReceived = new Counter('sse_events_received');

export const options = {
  scenarios: {
    sse_connections: {
      executor: 'constant-vus',
      vus: 5,          // 5개 관리자 SSE 연결
      duration: '60s',
    },
  },
};

const BASE_URL = 'http://localhost:4000/api';
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || 'admin-token-placeholder';

export default function () {
  // SSE 연결 (k6는 SSE를 HTTP streaming으로 처리)
  const res = http.get(
    `${BASE_URL}/orders/sse?storeId=perf-store`,
    {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      timeout: '65s',
    }
  );

  check(res, {
    'SSE 연결 성공 (200)': (r) => r.status === 200,
    'Content-Type: text/event-stream': (r) =>
      r.headers['Content-Type'].includes('text/event-stream'),
  });

  // 이벤트 수신 카운트
  if (res.body && res.body.includes('data:')) {
    const events = res.body.split('\n\n').filter(e => e.startsWith('data:'));
    sseEventsReceived.add(events.length);
  }

  sleep(1);
}
```

### SSE 알림 지연 측정 스크립트 (`perf-tests/sse-latency.js`)

```javascript
import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

const sseLatency = new Trend('sse_notification_latency_ms');

export const options = {
  vus: 1,
  iterations: 10,
  thresholds: {
    'sse_notification_latency_ms': ['p(95)<2000'], // NFR-01: 2초 이내
  },
};

const BASE_URL = 'http://localhost:4000/api';
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN;
const CUSTOMER_TOKEN = __ENV.CUSTOMER_TOKEN;
const TABLE_ID = __ENV.TABLE_ID;

export default function () {
  // 1. 주문 생성 시각 기록
  const orderTime = Date.now();

  // 2. 주문 생성
  http.post(
    `${BASE_URL}/order/create`,
    JSON.stringify({
      storeId: 'perf-store',
      tableId: TABLE_ID,
      items: [{ menuId: 'menu-001', menuName: '테스트메뉴', quantity: 1, unitPrice: 5000 }]
    }),
    { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CUSTOMER_TOKEN}` } }
  );

  // 3. SSE 이벤트 수신 대기 (최대 3초)
  const sseRes = http.get(
    `${BASE_URL}/orders/sse?storeId=perf-store`,
    {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      timeout: '3s',
    }
  );

  const receiveTime = Date.now();
  const latency = receiveTime - orderTime;

  sseLatency.add(latency);

  check(sseRes, {
    'SSE 알림 2초 이내 수신 (NFR-01)': () => latency < 2000,
  });
}
```

### 실행

```bash
k6 run \
  -e ADMIN_TOKEN=<admin_token> \
  perf-tests/sse-connections.js

k6 run \
  -e ADMIN_TOKEN=<admin_token> \
  -e CUSTOMER_TOKEN=<customer_token> \
  -e TABLE_ID=<table_id> \
  perf-tests/sse-latency.js
```

---

## 6. 시나리오 3: 테이블 목록 조회 응답 시간

**목적**: 테이블 목록 조회 API가 부하 상황에서도 500ms 이내로 응답하는지 검증

### k6 스크립트 (`perf-tests/table-list.js`)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },   // 5명으로 증가
    { duration: '30s', target: 10 },  // 10명 유지
    { duration: '10s', target: 0 },   // 종료
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:4000/api';
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN;

export default function () {
  const res = http.get(
    `${BASE_URL}/table/list?storeId=perf-store`,
    { headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` } }
  );

  check(res, {
    '테이블 목록 조회 성공 (200)': (r) => r.status === 200,
    '응답 시간 500ms 이내': (r) => r.timings.duration < 500,
  });

  sleep(0.5);
}
```

### 실행

```bash
k6 run -e ADMIN_TOKEN=<admin_token> perf-tests/table-list.js
```

---

## 7. Artillery 대안 스크립트

k6 대신 Artillery를 사용하는 경우:

```yaml
# perf-tests/artillery-config.yml
config:
  target: "http://localhost:4000/api"
  phases:
    - duration: 30
      arrivalRate: 10
      name: "동시 주문 부하 테스트"
  defaults:
    headers:
      Content-Type: "application/json"
      Authorization: "Bearer {{ $processEnvironment.ADMIN_TOKEN }}"

scenarios:
  - name: "테이블 목록 조회"
    flow:
      - get:
          url: "/table/list?storeId=perf-store"
          expect:
            - statusCode: 200
            - maxResponseTime: 500

  - name: "주문 생성"
    flow:
      - post:
          url: "/order/create"
          json:
            storeId: "perf-store"
            tableId: "{{ $processEnvironment.TABLE_ID }}"
            items:
              - menuId: "menu-001"
                menuName: "테스트메뉴"
                quantity: 1
                unitPrice: 5000
          expect:
            - statusCode: 201
            - maxResponseTime: 500
```

```bash
# Artillery 실행
ADMIN_TOKEN=<token> TABLE_ID=<id> artillery run perf-tests/artillery-config.yml

# HTML 리포트 생성
artillery run --output perf-results.json perf-tests/artillery-config.yml
artillery report perf-results.json
```

---

## 8. 결과 해석 (Interpreting Results)

### k6 출력 예시

```
scenarios: (100.00%) 1 scenario, 10 max VUs, 1m0s max duration
default: 10 looping VUs for 30s (gracefulStop: 30s)

✓ 주문 생성 성공 (201)
✓ 응답 시간 500ms 이내

checks.........................: 100.00% 300 out of 300
data_received..................: 45 kB 1.5 kB/s
data_sent......................: 30 kB 1.0 kB/s
http_req_duration..............: avg=120ms  min=45ms  med=110ms  max=480ms  p(90)=200ms  p(95)=350ms
http_req_failed................: 0.00%   0 out of 300
vus............................: 10      min=10     max=10
```

### 성능 목표 달성 기준

| 지표 | 목표 | 판정 기준 |
|------|------|-----------|
| `http_req_duration p(95)` | < 500ms | ✅ 통과 / ❌ 실패 |
| `http_req_failed rate` | < 1% | ✅ 통과 / ❌ 실패 |
| `sse_notification_latency_ms p(95)` | < 2000ms | ✅ NFR-01 충족 / ❌ 미충족 |
| `order_success_rate` | > 99% | ✅ 통과 / ❌ 실패 |

### 성능 미달 시 조치

**API 응답 시간 초과**:
1. MongoDB 쿼리 인덱스 확인 (`storeId`, `tableNumber` 인덱스)
2. Express 미들웨어 처리 시간 프로파일링
3. MongoDB 연결 풀 크기 조정 (`mongoose.connect` 옵션)

```javascript
// 연결 풀 최적화 예시
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 20,      // 기본값 5에서 증가
  serverSelectionTimeoutMS: 5000,
});
```

**SSE 알림 지연 초과**:
1. 이벤트 발행 로직의 동기 처리 여부 확인
2. SSE 연결 관리 메모리 누수 확인
3. Node.js 이벤트 루프 블로킹 여부 확인

```bash
# Node.js 이벤트 루프 지연 모니터링
node --inspect packages/server/dist/index.js
# Chrome DevTools에서 Performance 탭 확인
```
