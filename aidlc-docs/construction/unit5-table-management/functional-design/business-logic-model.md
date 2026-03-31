# Business Logic Model - Unit 5: 테이블 관리 (준형)

## 1. 테이블 목록 조회 플로우

```
입력: GET /api/table/list?storeId=<storeId>
      Authorization: Bearer <adminToken>

1. JWT 검증 (requireAdmin 미들웨어)
   - 실패 → 401/403 반환

2. storeId 파라미터 확인
   - 없으면 → 400 반환

3. JWT의 storeId와 쿼리 storeId 일치 확인 (BR-TABLE-08)
   - 불일치 → 403 반환

4. TableModel.find({ storeId }).sort({ tableNumber: 1 })
   - BR-TABLE-07: tableNumber 오름차순 정렬

5. 응답 변환: password 필드 제거 (BR-TABLE-02)

6. 반환: Table[] (password 제외)
```

---

## 2. 테이블 등록 플로우

```
입력: POST /api/table/create
      Body: { storeId, tableNumber, password }
      Authorization: Bearer <adminToken>

1. JWT 검증 (requireAdmin 미들웨어)

2. 입력 유효성 검증
   - storeId, tableNumber, password 모두 필수
   - tableNumber: 양의 정수
   - password: 최소 1자

3. 중복 확인 (BR-TABLE-01)
   - TableModel.findOne({ storeId, tableNumber })
   - 존재하면 → 400 "이미 존재하는 테이블 번호입니다."

4. 비밀번호 해싱 (BR-TABLE-02)
   - hashedPassword = bcrypt.hash(password, 10)

5. TableModel.create({
     storeId,
     tableNumber,
     password: hashedPassword,
     currentSessionId: null,
     sessionStartedAt: null,
     isActive: false
   })

6. 반환: 생성된 Table (password 제외)
```

---

## 3. 테이블 수정 플로우

```
입력: PUT /api/table/update/:id
      Body: { tableNumber?, password? }
      Authorization: Bearer <adminToken>

1. JWT 검증 (requireAdmin 미들웨어)

2. TableModel.findById(id)
   - 없으면 → 404 반환

3. storeId 소유권 확인 (BR-TABLE-08)
   - table.storeId !== req.user.storeId → 403 반환

4. tableNumber 변경 요청 시 중복 확인 (BR-TABLE-01)
   - TableModel.findOne({ storeId, tableNumber, _id: { $ne: id } })
   - 존재하면 → 400 반환

5. 업데이트 데이터 구성
   - tableNumber: 요청값 (있으면)
   - password: 요청에 password가 있고 비어있지 않으면 bcrypt.hash(password, 10) (BR-TABLE-06)
              없거나 빈 문자열이면 기존 password 유지

6. TableModel.findByIdAndUpdate(id, updateData, { new: true })

7. 반환: 수정된 Table (password 제외)
```

---

## 4. 테이블 삭제 플로우

```
입력: DELETE /api/table/delete/:id
      Authorization: Bearer <adminToken>

1. JWT 검증 (requireAdmin 미들웨어)

2. TableModel.findById(id)
   - 없으면 → 404 반환

3. storeId 소유권 확인 (BR-TABLE-08)

4. 활성 세션 확인 (BR-TABLE-04)
   - table.isActive === true → 400 "이용 중인 테이블은 삭제할 수 없습니다."

5. TableModel.findByIdAndDelete(id)

6. 반환: { success: true }
```

---

## 5. 세션 종료 플로우

```
입력: POST /api/table/end-session/:id
      Authorization: Bearer <adminToken>

[관리자앱 UI 흐름]
TableCard "이용 완료" 버튼 클릭
  → 확인 팝업 표시: "테이블 세션을 종료하시겠습니까? 현재 주문 내역은 과거 이력으로 이동됩니다."
  → 확인 클릭 → AdminStore.endTableSession(tableId) 호출
  → API 호출: POST /api/table/end-session/:id

[백엔드 처리]
1. JWT 검증 (requireAdmin 미들웨어)

2. TableModel.findById(id)
   - 없으면 → 404 반환

3. storeId 소유권 확인 (BR-TABLE-08)

4. 활성 세션 확인 (BR-TABLE-03)
   - table.isActive === false → 400 "활성 세션이 없는 테이블입니다."

5. SessionService.endSession(tableId) 호출

6. 반환: { success: true }

[SessionService.endSession 상세 - 아래 섹션 참조]
```

---

## 6. SessionService.endSession 상세 로직

```typescript
async endSession(tableId: string): Promise<void> {
  // 1. 테이블 조회
  const table = await TableModel.findById(tableId);
  if (!table) throw new Error('Table not found');
  if (!table.isActive) throw new Error('No active session');

  // 2. 테이블 상태 업데이트 (BR-TABLE-03)
  await TableModel.findByIdAndUpdate(tableId, {
    isActive: false,
    currentSessionId: null,
    sessionStartedAt: null
  });

  // 3. 주문 데이터 처리
  // - 별도 이동 없음: 주문은 그대로 유지
  // - Order.sessionId가 종료된 sessionId를 가리키므로
  //   과거 이력 조회 시 자동으로 필터링됨
  // - 추가 DB 작업 불필요
}
```

**호출자**: `TableController.endSession`

**Unit 1 연동**: 테이블 로그인 시 `SessionService`가 sessionId를 생성하고 `isActive=true`로 설정. 세션 종료는 Unit 5에서 처리.

---

## 7. 과거 주문 조회 플로우

```
입력: GET /api/order/history?storeId=&tableId=&date=
      Authorization: Bearer <adminToken>

1. JWT 검증 (requireAdmin 미들웨어)

2. 파라미터 확인
   - storeId, tableId 필수 (BR-TABLE-05)
   - date 선택 (YYYY-MM-DD 형식)

3. storeId 소유권 확인 (BR-TABLE-08)

4. 대상 테이블 조회
   - table = TableModel.findById(tableId)
   - 없으면 → 404 반환

5. 쿼리 조건 구성 (BR-TABLE-05)
   - 기본 조건: { storeId, tableId }
   - 활성 세션 주문 제외:
     if (table.isActive && table.currentSessionId) {
       query.sessionId = { $ne: table.currentSessionId }
     }
   - 날짜 필터 (date 파라미터 있을 때):
     const start = new Date(`${date}T00:00:00.000Z`)
     const end   = new Date(`${date}T23:59:59.999Z`)
     query.createdAt = { $gte: start, $lte: end }

6. OrderModel.find(query).sort({ createdAt: -1 })

7. 반환: Order[] (시간 역순)
```

---

## 8. AdminStore 액션 플로우 (Zustand)

```typescript
// fetchTables
async fetchTables(): Promise<void> {
  const res = await api.get(`/table/list?storeId=${auth.storeId}`);
  set({ tables: res.data });
}

// createTable
async createTable(data: { tableNumber, password }): Promise<void> {
  const res = await api.post('/table/create', { ...data, storeId: auth.storeId });
  set(state => ({ tables: [...state.tables, res.data] }));
  // 등록 후 tableNumber 오름차순 재정렬
  set(state => ({ tables: state.tables.sort((a, b) => a.tableNumber - b.tableNumber) }));
}

// updateTable
async updateTable(id: string, data: { tableNumber?, password? }): Promise<void> {
  const res = await api.put(`/table/update/${id}`, data);
  set(state => ({
    tables: state.tables.map(t => t._id === id ? res.data : t)
  }));
}

// deleteTable
async deleteTable(id: string): Promise<void> {
  await api.delete(`/table/delete/${id}`);
  set(state => ({ tables: state.tables.filter(t => t._id !== id) }));
}

// endTableSession
async endTableSession(tableId: string): Promise<void> {
  await api.post(`/table/end-session/${tableId}`);
  set(state => ({
    tables: state.tables.map(t =>
      t._id === tableId
        ? { ...t, isActive: false, currentSessionId: null, sessionStartedAt: null }
        : t
    )
  }));
}
```
