# Domain Entities - Unit 4: 주문 모니터링 (덕인)

## 1. SSEClient (SSE 클라이언트 연결)

| 필드 | 타입 | 설명 |
|------|------|------|
| clientId | string | UUID v4 - 연결 고유 식별자 |
| storeId | string | 매장 식별자 (격리 단위) |
| res | Response | Express Response 객체 (SSE 스트림) |
| connectedAt | Date | 연결 시각 |

- 인메모리 Map으로 관리: `Map<storeId, Map<clientId, SSEClient>>`
- 서버 재시작 시 모든 연결 초기화 (클라이언트가 재연결)
- 연결 해제(close 이벤트) 시 Map에서 즉시 제거

## 2. SSEEvent (SSE 이벤트 페이로드)

| 필드 | 타입 | 설명 |
|------|------|------|
| event | SSEEventType | 이벤트 타입 |
| data | Order \| OrderDeletedPayload | 이벤트 데이터 |

**SSEEventType**:
```typescript
type SSEEventType = 'new_order' | 'order_status_updated' | 'order_deleted';
```

**OrderDeletedPayload** (삭제 이벤트 전용):
```typescript
interface OrderDeletedPayload {
  orderId: string;   // 삭제된 주문 ID
  tableId: string;   // 해당 테이블 ID (총액 재계산용)
}
```

**SSE 전송 포맷**:
```
event: new_order\n
data: {"_id":"...","tableId":"...","status":"pending",...}\n\n
```

## 3. OrderStatusTransition (주문 상태 전이 규칙)

주문 상태는 단방향 전이만 허용:

```
pending → preparing → completed
```

| 현재 상태 | 허용되는 다음 상태 | 불허 상태 |
|-----------|-------------------|-----------|
| pending | preparing | completed, pending |
| preparing | completed | pending, preparing |
| completed | (없음 - 최종 상태) | pending, preparing, completed |

**유효 전이 맵**:
```typescript
const VALID_TRANSITIONS: Record<string, string> = {
  pending: 'preparing',
  preparing: 'completed',
};
// completed는 키 없음 → 전이 불가
```

## 4. DashboardView (대시보드 뷰 모델 - 테이블별 집계)

프론트엔드에서 orders 배열로부터 파생되는 뷰 모델 (서버 응답 아님)

| 필드 | 타입 | 설명 |
|------|------|------|
| tableId | string | 테이블 ID |
| tableNumber | number | 테이블 번호 (정렬 기준) |
| orders | Order[] | 해당 테이블의 주문 목록 |
| totalAmount | number | 현재 세션 총 주문액 합계 |
| latestOrder | Order \| null | 가장 최근 주문 (미리보기용) |
| hasNewOrder | boolean | 신규 주문 강조 표시 여부 |
| pendingCount | number | 대기중 주문 수 |
| preparingCount | number | 준비중 주문 수 |

**집계 로직**:
```
totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0)
latestOrder = orders.sort by createdAt desc [0]
hasNewOrder = orders.some(o => o.status === 'pending' && isRecentlyAdded(o))
```

**정렬**: DashboardView 배열은 tableNumber 오름차순 정렬
