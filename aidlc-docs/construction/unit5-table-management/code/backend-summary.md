# Backend Code Summary - Unit 5: 테이블 관리 (준형)

## 생성된 파일 목록

| 파일 경로 | 역할 |
|-----------|------|
| `packages/shared/src/types/table.ts` | 테이블 관련 TypeScript 인터페이스 |
| `packages/shared/src/types/orderHistory.ts` | 과거 주문 내역 TypeScript 인터페이스 |
| `packages/shared/src/types/index.ts` | 타입 re-export |
| `packages/server/src/models/TableModel.ts` | Mongoose 테이블 스키마 + 모델 |
| `packages/server/src/models/OrderModel.ts` | Mongoose 주문 스키마 (Unit 3 스텁) |
| `packages/server/src/services/SessionService.ts` | 세션 종료 서비스 (싱글톤) |
| `packages/server/src/controllers/TableController.ts` | 테이블 CRUD + 세션 종료 핸들러 |
| `packages/server/src/controllers/OrderHistoryController.ts` | 과거 주문 조회 핸들러 |
| `packages/server/src/routes/tableRoutes.ts` | 테이블 API 라우트 (/api/table) |
| `packages/server/src/routes/orderHistoryRoutes.ts` | 주문 이력 API 라우트 (/api/order) |
| `packages/server/src/middleware/auth.ts` | 인증 미들웨어 (Unit 1 스텁) |

## API 엔드포인트

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | /api/table/list?storeId= | 테이블 목록 조회 | requireAdmin |
| POST | /api/table/create | 테이블 등록 | requireAdmin |
| PUT | /api/table/update/:id | 테이블 수정 | requireAdmin |
| DELETE | /api/table/delete/:id | 테이블 삭제 | requireAdmin |
| POST | /api/table/end-session/:id | 세션 종료 | requireAdmin |
| GET | /api/order/history?storeId=&tableId=&date= | 과거 주문 조회 | requireAdmin |

## 비즈니스 규칙 매핑

| 규칙 | 구현 위치 |
|------|----------|
| BR-TABLE-01 중복 방지 | TableModel (인덱스), TableController (create/update) |
| BR-TABLE-02 bcrypt 해싱 | TableModel (toJSON), TableController (create/update) |
| BR-TABLE-03 세션 종료 | SessionService.endSession, TableController.endSession |
| BR-TABLE-04 활성 삭제 방지 | TableController.deleteTable |
| BR-TABLE-05 과거 주문 범위 | OrderHistoryController.listHistory |
| BR-TABLE-06 비밀번호 변경 | TableController.updateTable |
| BR-TABLE-07 오름차순 정렬 | TableController.listTables |
| BR-TABLE-08 소유권 검증 | 모든 컨트롤러 핸들러 |

## 테스트 파일

| 파일 | 테스트 수 | 범위 |
|------|----------|------|
| `__tests__/table/TableModel.test.ts` | 10 | 스키마 검증, 기본값, toJSON, 인덱스 |
| `__tests__/table/SessionService.test.ts` | 3 | 정상 종료, 미존재, 비활성 |
| `__tests__/table/TableController.test.ts` | 18 | 5개 핸들러 전체 |
| `__tests__/table/OrderHistoryController.test.ts` | 7 | 파라미터, 권한, 필터, 정렬 |

## 의존성

- Unit 1 (채원): `requireAdmin` 미들웨어 → 현재 스텁 사용
- Unit 3 (유진): `OrderModel` → 현재 최소 스텁 사용
