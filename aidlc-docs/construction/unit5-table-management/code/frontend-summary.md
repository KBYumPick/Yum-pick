# Frontend Code Summary - Unit 5: 테이블 관리 (준형)

## 생성된 파일 목록

| 파일 경로 | 역할 |
|-----------|------|
| `packages/admin-app/src/stores/adminTableStore.ts` | Zustand 테이블 관리 스토어 |
| `packages/admin-app/src/pages/TableManagementPage.tsx` | 테이블 관리 페이지 (/tables) |
| `packages/admin-app/src/components/TableCard.tsx` | 개별 테이블 카드 컴포넌트 |
| `packages/admin-app/src/components/TableForm.tsx` | 테이블 등록/수정 모달 폼 |
| `packages/admin-app/src/components/OrderHistoryModal.tsx` | 과거 주문 내역 모달 |

## 컴포넌트 계층 구조

```
TableManagementPage (라우트: /tables)
  ├── TableCard × N (테이블 목록 그리드)
  ├── TableForm (모달 — 등록/수정)
  └── OrderHistoryModal (모달 — 과거 주문)
```

## Zustand Store (adminTableStore)

| 상태/액션 | 타입 | 설명 |
|----------|------|------|
| tables | ITable[] | 테이블 목록 |
| isLoading | boolean | 로딩 상태 |
| error | string \| null | 에러 메시지 |
| fetchTables() | async | GET /api/table/list |
| createTable(data) | async | POST /api/table/create |
| updateTable(id, data) | async | PUT /api/table/update/:id |
| deleteTable(id) | async | DELETE /api/table/delete/:id |
| endTableSession(tableId) | async | POST /api/table/end-session/:id |

## 라우팅

```
/tables → TableManagementPage (requireAdmin)
```

## 테스트 파일

| 파일 | 테스트 수 | 범위 |
|------|----------|------|
| `__tests__/table/adminTableStore.test.ts` | 10 | 5개 액션 + 에러 처리 |
| `__tests__/table/TableManagementPage.test.tsx` | 7 | 마운트, 렌더링, 다이얼로그 |
| `__tests__/table/TableCard.test.tsx` | 8 | 활성/비활성 상태, 버튼 콜백 |
| `__tests__/table/TableForm.test.tsx` | 6 | 등록/수정 모드, 유효성 검증 |
| `__tests__/table/OrderHistoryModal.test.tsx` | 7 | fetch, 필터, 빈 상태, 렌더링 |

## 의존성

- Unit 1 (채원): auth store (storeId, token) → 현재 localStorage 직접 참조
- Unit 1 (채원): api axios 인스턴스 → 현재 fetch API 직접 사용
