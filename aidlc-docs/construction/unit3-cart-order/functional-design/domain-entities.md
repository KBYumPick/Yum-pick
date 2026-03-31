# Domain Entities - Unit 3: 장바구니&주문 (유진)

## 1. CartItem (장바구니 항목 - 클라이언트 전용)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| menuId | string | Yes | 메뉴 MongoDB ObjectId |
| menuName | string | Yes | 메뉴명 (스냅샷) |
| unitPrice | number | Yes | 단가 (스냅샷) |
| quantity | number | Yes | 수량 (1 ~ 99) |

- 서버에 저장되지 않음 - localStorage에만 존재
- menuName, unitPrice는 메뉴 추가 시점의 스냅샷 (이후 메뉴 변경 영향 없음)
- 소계(subtotal) = unitPrice × quantity (파생값, 저장 안 함)

**localStorage 키**: `yumpick_cart`
**직렬화 형식**: `JSON.stringify(CartItem[])`

---

## 2. Order (주문)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| _id | ObjectId | Auto | MongoDB 고유 ID |
| storeId | string | Yes | 매장 식별자 |
| tableId | string | Yes | 테이블 MongoDB ObjectId |
| sessionId | string | Yes | 테이블 세션 ID (UUID v4) |
| orderNumber | string | Auto | 날짜 기반 순번 (예: 20260331-001) |
| items | OrderItem[] | Yes | 주문 항목 배열 |
| totalAmount | number | Yes | 총 주문 금액 |
| status | OrderStatus | Yes | 주문 상태 |
| createdAt | Date | Auto | 주문 생성 시각 |
| updatedAt | Date | Auto | 최종 수정 시각 |

**인덱스**:
- `{ storeId: 1, sessionId: 1 }` - 세션별 주문 조회 최적화
- `{ storeId: 1, tableId: 1, createdAt: -1 }` - 테이블별 주문 내역 조회
- `{ storeId: 1, orderNumber: 1 }` - 주문 번호 중복 방지 (unique)

---

## 3. OrderItem (주문 항목 - Order 내 서브도큐먼트)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| menuName | string | Yes | 메뉴명 (주문 시점 스냅샷) |
| quantity | number | Yes | 수량 |
| unitPrice | number | Yes | 단가 (주문 시점 스냅샷) |

- 별도 컬렉션 없이 Order 도큐먼트 내 배열로 저장
- 메뉴 삭제/수정 이후에도 주문 내역 보존 (스냅샷 방식)
- 소계 = unitPrice × quantity (파생값)

---

## 4. OrderStatus (주문 상태 열거형)

| 값 | 한국어 | 설명 |
|----|--------|------|
| `pending` | 대기중 | 주문 접수, 아직 처리 전 |
| `preparing` | 준비중 | 주방에서 준비 중 |
| `completed` | 완료 | 음식 제공 완료 |

**상태 전이 규칙**: 단방향만 허용
```
pending → preparing → completed
```
- 역방향 전이 불가 (completed → preparing 등)
- 동일 상태로의 전이 불가

---

## 5. 주문 번호 생성 알고리즘

### 형식
```
YYYYMMDD-NNN
예: 20260331-001, 20260331-042
```

### 생성 절차

```
입력: storeId, 현재 날짜

1. 오늘 날짜 문자열 생성
   dateStr = format(new Date(), 'yyyyMMdd')  // 예: "20260331"

2. 오늘 해당 매장의 마지막 주문 번호 조회
   lastOrder = Order.findOne(
     { storeId, orderNumber: { $regex: `^${dateStr}-` } },
     { orderNumber: 1 },
     { sort: { orderNumber: -1 } }
   )

3. 순번 계산
   if lastOrder 없음:
     seq = 1
   else:
     lastSeq = parseInt(lastOrder.orderNumber.split('-')[1])  // "001" → 1
     seq = lastSeq + 1

4. 순번 3자리 패딩
   seqStr = String(seq).padStart(3, '0')  // 1 → "001", 42 → "042"

5. 최종 주문 번호
   orderNumber = `${dateStr}-${seqStr}`  // "20260331-001"
```

### 동시성 고려
- 동일 매장에서 동시 주문 발생 시 중복 가능성 존재
- MVP 단계: 단일 서버 환경이므로 허용 범위
- 중복 발생 시 MongoDB unique 인덱스가 에러를 발생시키며, 재시도 로직으로 처리

### 날짜 기준
- 서버 시각 기준 (UTC 또는 KST 일관 적용)
- 자정 이후 첫 주문은 새 날짜로 001부터 시작
