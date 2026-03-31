# Frontend Components - Unit 4: 주문 모니터링 (덕인)

## 관리자앱 (admin-app)

### 1. DashboardPage (대시보드 메인 화면)

**역할**: 테이블별 주문 현황 그리드 + SSE 실시간 연결 관리

**Props**: 없음 (라우트 컴포넌트)

**State** (AdminStore에서 구독):
```typescript
{
  orders: Order[];
  tables: Table[];
  dashboardViews: DashboardView[];  // computeDashboardViews 결과
  selectedTableId: string | null;   // 필터링 선택 테이블
  isLoading: boolean;
  error: string | null;
}
```

**사용자 인터랙션**:
1. 페이지 마운트 시 `fetchOrders()`, `fetchTables()` 호출
2. `useSSE` 훅으로 SSE 연결 수립
3. 테이블 필터 버튼 클릭 → `selectedTableId` 변경
4. TableOrderCard 클릭 → OrderDetailModal 열기

**렌더링 로직**:
```
필터 적용:
  displayedViews = selectedTableId
    ? dashboardViews.filter(v => v.tableId === selectedTableId)
    : dashboardViews

그리드 렌더링:
  displayedViews.map(view => <TableOrderCard key={view.tableId} view={view} />)
```

**레이아웃**:
- 상단: 테이블 필터 버튼 목록 (전체 + 테이블별)
- 본문: 반응형 카드 그리드 (CSS Grid)

---

### 2. TableOrderCard (테이블별 주문 카드)

**역할**: 테이블 단위 주문 현황 요약 카드

**Props**:
```typescript
interface TableOrderCardProps {
  view: DashboardView;
  onClick: (view: DashboardView) => void;
}
```

**표시 정보**:
- 테이블 번호 (헤더)
- 총 주문액 (원 단위 포맷: `12,000원`)
- 최신 주문 미리보기 (latestOrder의 items 첫 1~2개 + "외 N개")
- 대기중/준비중 주문 수 배지
- 신규 주문 강조 (hasNewOrder === true 시 pulse 애니메이션 + 강조 색상)

**시각적 상태**:
```typescript
// hasNewOrder === true
className="card card--new-order"  // 강조 스타일 + pulse 애니메이션

// 일반 상태
className="card"
```

**사용자 인터랙션**:
- 카드 클릭 → `onClick(view)` 호출 → OrderDetailModal 열기
- 카드 클릭 시 `hasNewOrder` 플래그 해제

---

### 3. OrderDetailModal (주문 상세 + 상태 변경)

**역할**: 테이블의 전체 주문 목록 상세 보기 + 상태 변경 + 삭제

**Props**:
```typescript
interface OrderDetailModalProps {
  view: DashboardView;
  onClose: () => void;
}
```

**표시 정보**:
- 테이블 번호 (모달 헤더)
- 총 주문액
- 주문 목록 (createdAt 오름차순):
  - 주문 번호, 주문 시각
  - 메뉴 목록 (menuName × quantity - unitPrice)
  - 주문 금액
  - 현재 상태 배지 (대기중/준비중/완료)
  - 상태 변경 버튼 (다음 상태로 전이 가능한 경우만 표시)
  - 삭제 버튼

**상태 변경 버튼 표시 조건**:
```typescript
// pending → "준비중으로 변경" 버튼 표시
// preparing → "완료로 변경" 버튼 표시
// completed → 버튼 없음 (최종 상태)
const nextStatusLabel: Record<string, string> = {
  pending: '준비중으로 변경',
  preparing: '완료로 변경',
};
```

**사용자 인터랙션**:
1. 상태 변경 버튼 클릭 → `updateOrderStatus(orderId, nextStatus)` 호출
2. 삭제 버튼 클릭 → 확인 팝업 표시
   - 확인 → `deleteOrder(orderId)` 호출
   - 취소 → 팝업 닫기
3. 모달 외부 클릭 또는 닫기 버튼 → `onClose()` 호출

**삭제 확인 팝업 메시지**:
```
"이 주문을 삭제하시겠습니까?
삭제된 주문은 복구할 수 없습니다."
[취소] [삭제]
```

---

### 4. useSSE (SSE 연결 관리 커스텀 훅)

**역할**: SSE 연결 수립, 이벤트 수신 처리, 연결 해제 클린업

**시그니처**:
```typescript
function useSSE(storeId: string | null): { isConnected: boolean; error: string | null }
```

**내부 로직**:
```typescript
useEffect(() => {
  if (!storeId) return;

  const token = getToken();  // localStorage에서 JWT 로드
  const url = `/api/sse/orders?storeId=${storeId}`;
  const eventSource = new EventSource(url, {
    // EventSource는 Authorization 헤더 미지원 → token을 query param으로 전달
    // 실제 구현: withCredentials 또는 token query param 방식
  });

  // 연결 성공
  eventSource.onopen = () => setIsConnected(true);

  // new_order 이벤트
  eventSource.addEventListener('new_order', (e) => {
    const order: Order = JSON.parse(e.data);
    adminStore.addOrder(order);           // orders 배열에 추가
    adminStore.setNewOrderFlag(order.tableId, true);  // 강조 플래그
  });

  // order_status_updated 이벤트
  eventSource.addEventListener('order_status_updated', (e) => {
    const order: Order = JSON.parse(e.data);
    adminStore.updateOrder(order);        // orders 배열에서 해당 항목 교체
  });

  // order_deleted 이벤트
  eventSource.addEventListener('order_deleted', (e) => {
    const { orderId } = JSON.parse(e.data);
    adminStore.removeOrder(orderId);      // orders 배열에서 제거
  });

  // 연결 오류
  eventSource.onerror = () => {
    setIsConnected(false);
    setError('실시간 연결이 끊겼습니다. 재연결 중...');
    // EventSource는 자동 재연결 시도
  };

  // 클린업 (컴포넌트 언마운트 또는 storeId 변경 시)
  return () => {
    eventSource.close();
    setIsConnected(false);
  };
}, [storeId]);
```

**반환값**:
```typescript
{
  isConnected: boolean;  // SSE 연결 상태 (UI 표시용)
  error: string | null;  // 연결 오류 메시지
}
```

**사용 위치**: DashboardPage에서 마운트 시 호출
```typescript
// DashboardPage 내부
const { storeId } = useAdminStore(state => state.auth);
const { isConnected } = useSSE(storeId);
```

---

## AdminStore - orders 관련 액션 (Zustand)

```typescript
// 상태
orders: Order[]

// 액션
fetchOrders(): Promise<void>
  → GET /api/order/list?storeId={storeId}
  → orders 배열 교체

updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>
  → PUT /api/order/status/{orderId} with { status }
  → 성공 시 orders 배열에서 해당 항목 status 업데이트

deleteOrder(orderId: string): Promise<void>
  → DELETE /api/order/delete/{orderId}
  → 성공 시 orders 배열에서 해당 항목 제거

// SSE 이벤트 수신용 내부 액션
addOrder(order: Order): void
  → orders 배열에 추가

updateOrder(order: Order): void
  → orders 배열에서 _id 일치 항목 교체

removeOrder(orderId: string): void
  → orders 배열에서 _id 일치 항목 제거

setNewOrderFlag(tableId: string, value: boolean): void
  → 해당 tableId의 신규 주문 강조 플래그 관리 (별도 Map 또는 Set)
```
