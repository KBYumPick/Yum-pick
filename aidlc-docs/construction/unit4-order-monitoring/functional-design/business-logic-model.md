# Business Logic Model - Unit 4: 주문 모니터링 (덕인)

## 1. 주문 상태 변경 플로우 (updateStatus)

```
입력: { id (orderId), status } + JWT (storeId)

1. DB에서 Order 조회 (_id = id)
   - 없으면 → 404 반환

2. storeId 검증 (order.storeId === req.user.storeId)
   - 불일치 → 404 반환

3. 상태 전이 유효성 검증
   - VALID_TRANSITIONS[order.status] === status 인지 확인
   - 불일치 → 400 반환: "유효하지 않은 상태 전이입니다."

4. Order 업데이트
   - status = 요청된 status
   - updatedAt = now

5. SSEService.broadcast(order.storeId, {
     event: 'order_status_updated',
     data: updatedOrder
   })

6. 반환: updatedOrder
```

## 2. 주문 삭제 플로우 (deleteOrder)

```
입력: { id (orderId) } + JWT (storeId)

1. DB에서 Order 조회 (_id = id)
   - 없으면 → 404 반환

2. storeId 검증 (order.storeId === req.user.storeId)
   - 불일치 → 404 반환

3. Order 삭제 (hard delete)

4. SSEService.broadcast(order.storeId, {
     event: 'order_deleted',
     data: { orderId: id, tableId: order.tableId }
   })

5. 반환: { success: true }
```

## 3. SSE 연결 플로우 (subscribe)

```
입력: query { storeId } + JWT 인증

1. JWT 검증 (role: 'admin', storeId 일치)
   - 실패 → 401 반환

2. SSE 헤더 설정
   Content-Type: text/event-stream
   Cache-Control: no-cache
   Connection: keep-alive

3. clientId = UUID v4 생성

4. SSEService.addClient(storeId, clientId, res)

5. 초기 연결 확인 메시지 전송
   data: {"event":"connected","clientId":"..."}\n\n

6. req.on('close') 이벤트 등록
   → SSEService.removeClient(storeId, clientId)

7. 연결 유지 (스트림 열린 상태 유지)
```

## 4. SSE 이벤트 브로드캐스트 로직 (SSEService)

```
SSEService 내부 구조:
  clients: Map<storeId, Map<clientId, SSEClient>>

addClient(storeId, clientId, res):
  if !clients.has(storeId): clients.set(storeId, new Map())
  clients.get(storeId).set(clientId, { clientId, storeId, res, connectedAt: now })

removeClient(storeId, clientId):
  clients.get(storeId)?.delete(clientId)
  if clients.get(storeId)?.size === 0: clients.delete(storeId)

broadcast(storeId, event: SSEEvent):
  storeClients = clients.get(storeId)
  if !storeClients: return  // 연결된 클라이언트 없음

  message = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`

  storeClients.forEach((client, clientId) => {
    try:
      client.res.write(message)
    catch (e):
      // 쓰기 실패 시 해당 클라이언트 제거 (연결 끊김)
      removeClient(storeId, clientId)
  })
```

## 5. 대시보드 데이터 집계 로직 (프론트엔드 AdminStore)

```
fetchOrders():
  1. GET /api/order/list?storeId={storeId} 호출
  2. 응답 Order[] → store.orders에 저장

computeDashboardViews(orders: Order[], tables: Table[]): DashboardView[]
  1. orders를 tableId 기준으로 그룹핑
     grouped = Map<tableId, Order[]>

  2. tables 배열을 순회하며 DashboardView 생성
     tables.forEach(table => {
       tableOrders = grouped.get(table._id) ?? []
       view = {
         tableId: table._id,
         tableNumber: table.tableNumber,
         orders: tableOrders,
         totalAmount: tableOrders.reduce((sum, o) => sum + o.totalAmount, 0),
         latestOrder: tableOrders.sort by createdAt desc [0] ?? null,
         hasNewOrder: false,  // SSE 이벤트 수신 시 true로 설정
         pendingCount: tableOrders.filter(o => o.status === 'pending').length,
         preparingCount: tableOrders.filter(o => o.status === 'preparing').length,
       }
     })

  3. tableNumber 오름차순 정렬
  4. 반환: DashboardView[]
```

## 6. SSE 이벤트 수신 처리 로직 (프론트엔드 useSSE 훅)

```
new_order 이벤트 수신:
  1. store.orders에 새 Order 추가
  2. 해당 tableId의 DashboardView.hasNewOrder = true
  3. 대시보드 뷰 재계산

order_status_updated 이벤트 수신:
  1. store.orders에서 orderId 일치하는 항목 찾아 status 업데이트
  2. 대시보드 뷰 재계산

order_deleted 이벤트 수신:
  1. store.orders에서 orderId 일치하는 항목 제거
  2. 해당 tableId의 totalAmount 재계산
  3. 대시보드 뷰 재계산
```
