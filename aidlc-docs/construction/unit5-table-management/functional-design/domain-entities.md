# Domain Entities - Unit 5: 테이블 관리 (준형)

## 1. Table (테이블)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| _id | ObjectId | Auto | MongoDB 고유 식별자 |
| storeId | string | Yes | 매장 식별자 |
| tableNumber | number | Yes | 테이블 번호 (storeId 내 고유) |
| password | string | Yes | bcrypt 해싱된 비밀번호 |
| currentSessionId | string \| null | No | 현재 활성 세션 ID (없으면 null) |
| sessionStartedAt | Date \| null | No | 세션 시작 시각 (없으면 null) |
| isActive | boolean | Yes | 세션 활성 여부 (true: 이용 중, false: 비어 있음) |
| createdAt | Date | Auto | 테이블 등록 시각 |
| updatedAt | Date | Auto | 마지막 수정 시각 |

**인덱스**:
- `{ storeId, tableNumber }` — unique 복합 인덱스 (동일 매장 내 테이블 번호 중복 방지)

**상태 정의**:
- `isActive: true` — 고객이 이용 중인 테이블. `currentSessionId`와 `sessionStartedAt`이 설정됨
- `isActive: false` — 비어 있는 테이블. `currentSessionId: null`, `sessionStartedAt: null`

---

## 2. TableSession (테이블 세션 개념)

TableSession은 별도 컬렉션이 아닌 **Table 엔티티의 isActive 플래그 기반 개념**입니다.

| 개념 필드 | 출처 | 설명 |
|-----------|------|------|
| sessionId | Table.currentSessionId | 현재 세션의 고유 ID (UUID v4) |
| tableId | Table._id | 세션이 속한 테이블 |
| storeId | Table.storeId | 매장 식별자 |
| startedAt | Table.sessionStartedAt | 세션 시작 시각 |
| isActive | Table.isActive | 세션 활성 여부 |

**세션 라이프사이클**:
```
[테이블 로그인] → isActive=true, currentSessionId=UUID, sessionStartedAt=now
      ↓
[고객 이용 중] → 주문 생성 시 sessionId 포함
      ↓
[세션 종료] → isActive=false, currentSessionId=null, sessionStartedAt=null
              (주문 데이터는 그대로 유지, sessionId로 과거 이력 조회 가능)
```

**주문과의 연동**:
- 주문 생성 시 `Order.sessionId = Table.currentSessionId` 로 기록
- 세션 종료 후에도 주문 데이터는 삭제되지 않음
- `isActive=false`인 세션의 주문 = 과거 이력

---

## 3. OrderHistory (과거 주문 뷰 모델)

과거 주문 조회 API(`GET /api/order/history`)의 응답 모델입니다. OrderModel의 서브셋으로, 종료된 세션의 주문만 포함합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| _id | string | 주문 고유 ID |
| storeId | string | 매장 식별자 |
| tableId | string | 테이블 ID |
| sessionId | string | 주문이 속한 세션 ID |
| orderNumber | string | 주문 번호 (자동 생성) |
| items | OrderItem[] | 주문 항목 목록 |
| totalAmount | number | 총 주문 금액 |
| status | 'pending' \| 'preparing' \| 'completed' | 주문 상태 |
| createdAt | Date | 주문 시각 |

**OrderItem**:

| 필드 | 타입 | 설명 |
|------|------|------|
| menuName | string | 메뉴명 (주문 시점 스냅샷) |
| quantity | number | 수량 |
| unitPrice | number | 단가 (주문 시점 스냅샷) |

**조회 조건**:
- `storeId` 필수
- `tableId` 필수 (테이블별 조회)
- `date` 선택 (날짜 필터, 해당 날짜의 00:00:00 ~ 23:59:59 범위)
- 종료된 세션(`isActive=false`)의 주문만 포함
- `createdAt` 내림차순 정렬 (최신 주문 먼저)

**활성 세션 주문과의 구분**:
- 현재 세션 주문: `GET /api/order/list?sessionId=<currentSessionId>`
- 과거 이력 주문: `GET /api/order/history?storeId=&tableId=&date=`
  - 내부적으로 해당 테이블의 종료된 sessionId 목록을 기준으로 필터링
