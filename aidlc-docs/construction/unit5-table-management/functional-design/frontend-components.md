# Frontend Components - Unit 5: 테이블 관리 (준형)

## 관리자앱 (admin-app)

---

### 1. TableManagementPage (테이블 관리 페이지)

**역할**: 테이블 목록 조회, 등록/수정/삭제, 세션 종료, 과거 주문 조회 진입점

**Props**: 없음 (라우트 컴포넌트, `/tables`)

**State**:
```typescript
{
  isFormOpen: boolean;           // TableForm 모달 열림 여부
  editingTable: Table | null;    // 수정 중인 테이블 (null이면 등록 모드)
  historyTableId: string | null; // 과거 주문 조회 대상 테이블 ID
}
```

**Zustand 연동**:
```typescript
const { tables, fetchTables, deleteTable, endTableSession } = useAdminStore();
```

**마운트 시 동작**:
- `fetchTables()` 호출 → 테이블 목록 로드 (tableNumber 오름차순)

**레이아웃**:
```
[테이블 관리]                    [+ 테이블 추가] 버튼
─────────────────────────────────────────────────
[TableCard] [TableCard] [TableCard] ...  (그리드)
```

**사용자 인터랙션**:
- "테이블 추가" 버튼 → `isFormOpen=true`, `editingTable=null` → TableForm(등록 모드) 열기
- TableCard의 수정 버튼 → `isFormOpen=true`, `editingTable=table` → TableForm(수정 모드) 열기
- TableCard의 삭제 버튼 → 확인 팝업 → `deleteTable(id)` 호출
- TableCard의 "이용 완료" 버튼 → 확인 팝업 → `endTableSession(id)` 호출
- TableCard의 "주문 내역" 버튼 → `historyTableId=table._id` → OrderHistoryModal 열기

**삭제 확인 팝업 메시지**: "테이블을 삭제하시겠습니까?"

**세션 종료 확인 팝업 메시지**: "테이블 세션을 종료하시겠습니까? 현재 주문 내역은 과거 이력으로 이동됩니다."

**자식 컴포넌트**:
- `TableCard` × N
- `TableForm` (모달)
- `OrderHistoryModal` (모달)

---

### 2. TableCard (테이블 카드)

**역할**: 개별 테이블의 상태, 세션 정보, 액션 버튼 표시

**Props**:
```typescript
interface TableCardProps {
  table: Table;
  onEdit: (table: Table) => void;
  onDelete: (tableId: string) => void;
  onEndSession: (tableId: string) => void;
  onViewHistory: (tableId: string) => void;
}
```

**표시 정보**:
```
┌─────────────────────────────┐
│  테이블 N                    │
│  ● 이용 중  /  ○ 비어 있음   │  ← isActive 기반 상태 배지
│  세션 시작: HH:MM            │  ← isActive=true일 때만 표시
│─────────────────────────────│
│  [수정]  [삭제]              │
│  [이용 완료]  [주문 내역]    │  ← isActive=true일 때 "이용 완료" 활성화
└─────────────────────────────┘
```

**상태 배지**:
- `isActive=true`: 초록색 배지 "이용 중"
- `isActive=false`: 회색 배지 "비어 있음"

**버튼 조건부 렌더링**:
- "이용 완료" 버튼: `isActive=true`일 때만 활성화 (false이면 비활성화 또는 숨김)
- "삭제" 버튼: `isActive=true`이면 비활성화 (BR-TABLE-04)
- "주문 내역" 버튼: 항상 표시

**세션 시작 시각 표시**:
```typescript
// sessionStartedAt이 있을 때만 표시
const elapsed = sessionStartedAt
  ? formatDistanceToNow(new Date(sessionStartedAt), { locale: ko })
  : null;
// 예: "2시간 전"
```

---

### 3. TableForm (테이블 등록/수정 폼)

**역할**: 테이블 등록 및 수정 폼 모달

**Props**:
```typescript
interface TableFormProps {
  table: Table | null;   // null이면 등록 모드, 값이 있으면 수정 모드
  onClose: () => void;
  onSubmit: (data: TableFormData) => Promise<void>;
}

interface TableFormData {
  tableNumber: number;
  password: string;      // 수정 모드에서 빈 문자열이면 비밀번호 유지
}
```

**State**:
```typescript
{
  tableNumber: string;   // 입력값 (string으로 관리 후 submit 시 number 변환)
  password: string;
  isLoading: boolean;
  error: string | null;
}
```

**모드별 동작**:

등록 모드 (`table === null`):
- 제목: "테이블 추가"
- tableNumber: 빈 값으로 시작
- password: 빈 값으로 시작, 필수 입력
- submit → `createTable({ tableNumber, password })`

수정 모드 (`table !== null`):
- 제목: "테이블 수정"
- tableNumber: 기존 값으로 초기화
- password: 빈 값으로 시작 (힌트: "변경하지 않으려면 비워두세요")
- submit → `updateTable(table._id, { tableNumber, password })`

**폼 유효성 검증**:
- tableNumber: 필수, 양의 정수
- password: 등록 모드에서 필수, 수정 모드에서 선택

**에러 처리**:
- API 오류 메시지를 폼 하단에 표시
- "이미 존재하는 테이블 번호입니다." 등 서버 오류 메시지 그대로 표시

**레이아웃**:
```
[테이블 추가 / 테이블 수정]
─────────────────────────
테이블 번호 *
[          ]

비밀번호 (* / 변경하지 않으려면 비워두세요)
[          ]

[에러 메시지 (있을 때)]
─────────────────────────
              [취소]  [저장]
```

---

### 4. OrderHistoryModal (과거 주문 내역 모달)

**역할**: 특정 테이블의 과거 주문 내역 조회 (날짜 필터 포함)

**Props**:
```typescript
interface OrderHistoryModalProps {
  tableId: string;
  tableNumber: number;
  onClose: () => void;
}
```

**State**:
```typescript
{
  orders: OrderHistory[];
  selectedDate: string;   // YYYY-MM-DD, 빈 문자열이면 전체 조회
  isLoading: boolean;
  error: string | null;
}
```

**마운트 시 동작**:
- `fetchHistory(tableId, '')` 호출 → 날짜 필터 없이 전체 과거 주문 로드

**날짜 필터 변경 시**:
- `selectedDate` 변경 → `fetchHistory(tableId, selectedDate)` 재호출

**fetchHistory 내부 로직**:
```typescript
const fetchHistory = async (tableId: string, date: string) => {
  setIsLoading(true);
  const params = new URLSearchParams({
    storeId: auth.storeId,
    tableId,
    ...(date ? { date } : {})
  });
  const res = await api.get(`/order/history?${params}`);
  setOrders(res.data);
  setIsLoading(false);
};
```

**레이아웃**:
```
[테이블 N - 과거 주문 내역]                    [X]
─────────────────────────────────────────────────
날짜 필터: [날짜 선택 input]  [전체 보기]
─────────────────────────────────────────────────
주문번호    시각         메뉴              금액    상태
#0001    14:32      김치찌개 x1        8,000   완료
                   된장찌개 x2       16,000
─────────────────────────────────────────────────
#0002    13:15      비빔밥 x2         14,000   완료
─────────────────────────────────────────────────
[로딩 스피너 / 데이터 없음 메시지]
```

**주문 항목 표시**:
- 주문별로 그룹화하여 표시
- 각 주문: 주문번호, 시각, 메뉴 목록(메뉴명 + 수량 + 단가), 총액, 상태
- 시간 역순 정렬 (최신 주문 먼저, 서버 정렬 그대로 표시)

**빈 상태 메시지**:
- 날짜 필터 없을 때: "과거 주문 내역이 없습니다."
- 날짜 필터 있을 때: "해당 날짜의 주문 내역이 없습니다."

---

## 라우팅 구조 (관리자앱)

```
/tables → TableManagementPage (requireAdmin)
```

**AdminApp 전체 라우팅 참고** (Unit 1 frontend-components.md):
```
/ → App (세션 복원)
  /login → LoginPage
  /dashboard → DashboardPage
  /tables → TableManagementPage   ← Unit 5
  /menus → MenuManagementPage
```
