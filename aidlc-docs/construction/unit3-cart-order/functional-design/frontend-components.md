# Frontend Components - Unit 3: 장바구니&주문 (유진)

## 고객앱 (customer-app)

---

### 1. CartComponent (장바구니 패널)

**역할**: 장바구니 항목 표시, 수량 조절, 총액 표시, 주문 확정 진입

**표시 방식**: 하단 슬라이드업 패널 또는 사이드 드로어 (메뉴 화면 위에 오버레이)

**Props**: 없음 (CustomerStore에서 직접 구독)

**State** (로컬):
```typescript
{
  isSubmitting: boolean;  // 주문 생성 중 여부
}
```

**CustomerStore 구독**:
```typescript
const cart = useCustomerStore(state => state.cart);
const updateQuantity = useCustomerStore(state => state.updateQuantity);
const removeFromCart = useCustomerStore(state => state.removeFromCart);
const clearCart = useCustomerStore(state => state.clearCart);
```

**파생값**:
```typescript
const totalAmount = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
```

**UI 구성**:
```
[헤더]
  - "장바구니" 제목
  - 전체 항목 수 뱃지
  - "전체 삭제" 버튼 (cart.length > 0 일 때만 표시)
  - 닫기(X) 버튼

[항목 목록] (cart.length === 0 이면 빈 상태 메시지)
  - CartItemRow 컴포넌트 반복 렌더링

[푸터]
  - 총액 표시: "합계: 12,000원"
  - "주문하기" 버튼 (cart.length === 0 이면 비활성화)
```

**사용자 인터랙션**:
1. 수량 증가(+) 버튼 → `updateQuantity(menuId, quantity + 1)`
2. 수량 감소(-) 버튼 → `updateQuantity(menuId, quantity - 1)` (1에서 감소 시 삭제)
3. 삭제(X) 버튼 → `removeFromCart(menuId)`
4. "전체 삭제" 버튼 → 확인 다이얼로그 → `clearCart()`
5. "주문하기" 버튼 → OrderConfirmModal 열기

**접근성**:
- 수량 조절 버튼 최소 44×44px
- 버튼에 aria-label 제공 (예: "수량 증가", "항목 삭제")

---

### 2. CartItemRow (장바구니 항목 행)

**역할**: 개별 장바구니 항목 표시 및 수량 조절

**Props**:
```typescript
interface CartItemRowProps {
  item: CartItem;                                    // 장바구니 항목
  onIncrease: (menuId: string) => void;             // 수량 증가
  onDecrease: (menuId: string) => void;             // 수량 감소
  onRemove: (menuId: string) => void;               // 항목 삭제
}
```

**UI 구성**:
```
[메뉴명]          [수량 조절]        [소계]
김치찌개           [-] [2] [+]      16,000원  [X]
```

**수량 버튼 상태**:
- `-` 버튼: quantity === 1 이면 삭제 아이콘으로 변경 (또는 빨간색 강조)
- `+` 버튼: quantity === 99 이면 비활성화

---

### 3. CartBadge (장바구니 뱃지 - 메뉴 화면 내 버튼)

**역할**: 메뉴 화면 하단 고정 버튼으로 장바구니 항목 수와 총액 표시

**Props**: 없음 (CustomerStore 구독)

**UI 구성**:
```
[장바구니 아이콘] [3개 항목]    [24,000원 →]
```

**표시 조건**: cart.length > 0 일 때만 표시 (빈 장바구니 시 숨김)

**인터랙션**: 클릭 시 CartComponent 패널 열기

---

### 4. OrderConfirmModal (주문 최종 확인 모달)

**역할**: 주문 확정 전 최종 내역 확인 및 주문 생성 실행

**표시 방식**: 전체 화면 모달 또는 바텀 시트

**Props**:
```typescript
interface OrderConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**State** (로컬):
```typescript
{
  isLoading: boolean;
  error: string | null;
  successOrderNumber: string | null;  // 주문 성공 시 주문 번호
  countdown: number;                  // 리다이렉트 카운트다운 (5 → 0)
}
```

**CustomerStore 구독**:
```typescript
const cart = useCustomerStore(state => state.cart);
const createOrder = useCustomerStore(state => state.createOrder);
```

**UI 구성 - 확인 화면** (successOrderNumber === null):
```
[제목] 주문 확인

[주문 항목 목록]
  - 메뉴명 / 수량 / 소계

[구분선]
[총액] 합계: 24,000원

[버튼 영역]
  - "취소" 버튼 (회색)
  - "주문 확정" 버튼 (강조색, isLoading 시 비활성화)

[에러 메시지] (error !== null 시 표시)
```

**UI 구성 - 성공 화면** (successOrderNumber !== null):
```
[성공 아이콘]
[주문 번호] 20260331-001
[안내 메시지] 주문이 접수되었습니다.
[카운트다운] N초 후 메뉴 화면으로 이동합니다.
```

**주문 확정 플로우**:
```
1. "주문 확정" 버튼 클릭
2. isLoading = true, error = null
3. createOrder() 호출 (CustomerStore)
4. 성공:
   a. successOrderNumber = order.orderNumber
   b. clearCart() (CustomerStore 내부에서 처리)
   c. 카운트다운 시작 (5초)
   d. 5초 후 onClose() + navigate('/menu')
5. 실패:
   a. error = 에러 메시지
   b. isLoading = false
   c. 장바구니 유지
```

**카운트다운 구현**:
```typescript
useEffect(() => {
  if (successOrderNumber) {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          navigate('/menu');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }
}, [successOrderNumber]);
```

---

### 5. OrderHistoryPage (주문 내역 페이지)

**역할**: 현재 세션의 주문 목록 표시 및 수동 새로고침

**Props**: 없음 (라우트 컴포넌트)

**State** (로컬):
```typescript
{
  isLoading: boolean;
  error: string | null;
}
```

**CustomerStore 구독**:
```typescript
const orders = useCustomerStore(state => state.orders);
const fetchOrders = useCustomerStore(state => state.fetchOrders);
```

**마운트 시 동작**:
```typescript
useEffect(() => {
  fetchOrders();  // 페이지 진입 시 최신 주문 목록 조회
}, []);
```

**UI 구성**:
```
[헤더]
  - "주문 내역" 제목
  - "새로고침" 버튼 (아이콘 또는 텍스트)

[주문 목록] (orders.length === 0 이면 빈 상태 메시지)
  - OrderCard 컴포넌트 반복 렌더링
  - createdAt 오름차순 (오래된 주문이 위)

[빈 상태]
  - "아직 주문 내역이 없습니다."
```

**새로고침 인터랙션**:
```
"새로고침" 버튼 클릭
  → isLoading = true
  → fetchOrders() 호출
  → 완료 시 isLoading = false
```

**라우트**: `/orders`

---

### 6. OrderCard (개별 주문 카드)

**역할**: 단일 주문의 요약 정보 표시

**Props**:
```typescript
interface OrderCardProps {
  order: Order;
}
```

**UI 구성**:
```
┌─────────────────────────────────────────┐
│ [주문 번호] 20260331-001    [상태 뱃지]  │
│ [주문 시각] 2026-03-31 14:23            │
│─────────────────────────────────────────│
│ 김치찌개 × 2                  16,000원  │
│ 된장찌개 × 1                   8,000원  │
│─────────────────────────────────────────│
│ 합계                          24,000원  │
└─────────────────────────────────────────┘
```

**상태 뱃지 스타일**:
| 상태 | 텍스트 | 색상 |
|------|--------|------|
| pending | 대기중 | 노란색 배경 |
| preparing | 준비중 | 파란색 배경 |
| completed | 완료 | 초록색 배경 |

**Props 타입 참조**:
```typescript
interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'completed';
  createdAt: string;  // ISO 8601
}

interface OrderItem {
  menuName: string;
  quantity: number;
  unitPrice: number;
}
```

**시각 표시 형식**: `YYYY-MM-DD HH:mm` (로컬 시각 기준)

---

## CustomerStore - cart/order 관련 구현 참고

```typescript
// Zustand store 슬라이스 (cart + order)
interface CustomerStoreCartOrder {
  // 상태
  cart: CartItem[];
  orders: Order[];

  // 장바구니 액션
  addToCart: (menu: Menu) => void;
  removeFromCart: (menuId: string) => void;
  updateQuantity: (menuId: string, qty: number) => void;
  clearCart: () => void;

  // 주문 액션
  createOrder: () => Promise<Order>;
  fetchOrders: () => Promise<void>;
}

// localStorage 초기화 (store 생성 시)
const loadCartFromStorage = (): CartItem[] => {
  try {
    const raw = localStorage.getItem('yumpick_cart');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
```

---

## 라우팅 구조 (Unit 3 관련)

```
/menu     → MenuPage (CartBadge 포함, CartComponent 오버레이)
/orders   → OrderHistoryPage
```

- OrderConfirmModal은 라우트 변경 없이 /menu 위에 모달로 표시
- 주문 성공 후 5초 카운트다운 → /menu로 자동 이동
