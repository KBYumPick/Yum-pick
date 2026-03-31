# Business Logic Model - Unit 3: 장바구니&주문 (유진)

## 1. 장바구니 추가 (addToCart)

```
입력: menu: { _id, name, price, ... }

1. 현재 cart 배열에서 menuId === menu._id 항목 탐색

2. 항목이 이미 존재하는 경우:
   a. 현재 quantity 확인
   b. quantity >= 99 → 아무 동작 없음 (BR-CART-01)
   c. quantity < 99 → quantity += 1

3. 항목이 없는 경우:
   a. 새 CartItem 생성
      { menuId: menu._id, menuName: menu.name, unitPrice: menu.price, quantity: 1 }
   b. cart 배열에 추가

4. localStorage 동기화
   localStorage.setItem('yumpick_cart', JSON.stringify(cart))

5. 반환: 없음 (상태 업데이트)
```

---

## 2. 장바구니 수량 변경 (updateQuantity)

```
입력: menuId: string, qty: number

1. cart 배열에서 menuId 항목 탐색
   - 없으면 → 아무 동작 없음

2. qty <= 0 → removeFromCart(menuId) 호출 (BR-CART-02)

3. qty > 99 → qty = 99 (BR-CART-01 클램핑)

4. 해당 항목의 quantity = qty

5. localStorage 동기화

6. 반환: 없음 (상태 업데이트)
```

---

## 3. 장바구니 항목 삭제 (removeFromCart)

```
입력: menuId: string

1. cart 배열에서 menuId !== menuId 필터링
   cart = cart.filter(item => item.menuId !== menuId)

2. localStorage 동기화

3. 반환: 없음 (상태 업데이트)
```

---

## 4. 장바구니 비우기 (clearCart)

```
입력: 없음

1. cart = []

2. localStorage에서 키 제거
   localStorage.removeItem('yumpick_cart')

3. 반환: 없음 (상태 업데이트)
```

---

## 5. localStorage 동기화 로직

### 초기화 (앱 마운트 시)

```
1. localStorage.getItem('yumpick_cart') 조회

2. 값이 없으면 → cart = []

3. 값이 있으면:
   try:
     parsed = JSON.parse(value)
     cart = Array.isArray(parsed) ? parsed : []
   catch:
     cart = []  // 파싱 실패 시 빈 배열 (BR-CART-04)

4. CustomerStore의 cart 상태에 설정
```

### 저장 (상태 변경 시)

```
Zustand의 cart 상태가 변경될 때마다:
  localStorage.setItem('yumpick_cart', JSON.stringify(cart))

구현 방식: Zustand subscribe 또는 각 액션 내에서 직접 호출
```

---

## 6. 주문 생성 플로우 (createOrder)

```
입력: CustomerStore의 cart, session { storeId, tableId, sessionId }

[프론트엔드]
1. cart가 비어있으면 → 에러 처리, 중단 (BR-ORDER-01)

2. totalAmount 계산
   total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

3. 요청 페이로드 구성
   {
     storeId: session.storeId,
     tableId: session.tableId,
     sessionId: session.sessionId,
     items: cart.map(item => ({
       menuName: item.menuName,
       quantity: item.quantity,
       unitPrice: item.unitPrice
     })),
     totalAmount: total
   }

4. POST /api/order/create 호출
   - isLoading = true

[백엔드 - OrderController.createOrder]
5. JWT 미들웨어로 인증 확인 (role: 'table')

6. sessionId 검증
   req.user.sessionId !== body.sessionId → 401 반환 (BR-ORDER-04)

7. items 배열 비어있는지 확인
   items.length === 0 → 400 반환 (BR-ORDER-01)

8. 각 item의 quantity 범위 검증 (1 ~ 99) (BR-ORDER-03)

9. totalAmount 서버 재계산 및 검증
   serverTotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
   serverTotal !== body.totalAmount → 400 반환 (BR-ORDER-02)

10. 주문 번호 생성
    orderNumber = generateOrderNumber(storeId)  // 날짜 기반 순번

11. Order 도큐먼트 생성 및 저장
    {
      storeId, tableId, sessionId,
      orderNumber,
      items,
      totalAmount,
      status: 'pending'
    }

12. 저장된 Order 반환

[프론트엔드 - 성공 처리]
13. orders 배열에 새 주문 추가

14. 주문 번호 표시 (성공 메시지 또는 모달)

15. clearCart() 호출 (BR-CART-05)

16. 5초 타이머 시작
    setTimeout(() => navigate('/menu'), 5000)

[프론트엔드 - 실패 처리]
13. 에러 메시지 표시
14. cart 유지 (clearCart 호출 안 함) (BR-CART-05)
15. isLoading = false
```

---

## 7. 주문 번호 생성 (generateOrderNumber)

```
입력: storeId: string

1. 오늘 날짜 문자열 생성
   dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
   // 예: "20260331"

2. 오늘 해당 매장의 마지막 주문 조회
   lastOrder = await Order.findOne(
     { storeId, orderNumber: { $regex: `^${dateStr}-` } },
     { orderNumber: 1 },
     { sort: { orderNumber: -1 } }
   )

3. 순번 계산
   seq = lastOrder
     ? parseInt(lastOrder.orderNumber.split('-')[1], 10) + 1
     : 1

4. 반환: `${dateStr}-${String(seq).padStart(3, '0')}`
   // 예: "20260331-001"
```

---

## 8. 주문 내역 조회 플로우 (fetchOrders)

```
입력: session { storeId, tableId, sessionId }

[프론트엔드]
1. GET /api/order/list?storeId=&tableId=&sessionId= 호출

[백엔드 - OrderController.listOrders]
2. JWT 미들웨어로 인증 확인

3. 쿼리 파라미터 파싱
   { storeId, tableId, sessionId, status? }

4. 필터 구성
   filter = { storeId, tableId, sessionId }
   status 있으면 filter.status = status 추가

5. Order 조회
   orders = await Order.find(filter).sort({ createdAt: 1 })
   // createdAt 오름차순 (BR-QUERY-02)

6. 반환: Order[]

[프론트엔드]
7. CustomerStore의 orders 상태 업데이트

8. OrderHistoryPage에서 렌더링
```

---

## 9. 주문 상세 조회 플로우 (getOrder)

```
입력: id: string (Order MongoDB ObjectId)

[백엔드 - OrderController.getOrder]
1. JWT 미들웨어로 인증 확인

2. Order.findById(id) 조회
   - 없으면 → 404 반환

3. storeId 검증
   order.storeId !== req.user.storeId → 404 반환 (보안상 403 대신 404)

4. 반환: Order
```
