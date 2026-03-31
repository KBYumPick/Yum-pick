# Component Dependencies - 냠픽(Yumpick)

## Dependency Matrix

| Component | Depends On |
|-----------|-----------|
| AuthController | AuthModel, SessionService, Middleware |
| MenuController | MenuModel, Middleware |
| OrderController | OrderModel, SSEService, Middleware |
| TableController | TableModel, SessionService, Middleware |
| SSEController | SSEService, Middleware |
| SSEService | (standalone - 클라이언트 연결 관리) |
| SessionService | TableModel |
| Middleware | AuthModel (토큰 검증) |
| CustomerApp | Backend API, SharedUI, SharedTypes |
| AdminApp | Backend API, SSE endpoint, SharedUI, SharedTypes |

## Communication Patterns

```
+------------------+     HTTP/REST      +------------------+
|   Customer App   | -----------------> |    Express API    |
|   (React+Zustand)|                    |   (Controllers)  |
+------------------+                    +--------+---------+
                                                 |
+------------------+     HTTP/REST      +--------+---------+
|    Admin App     | -----------------> |    Express API    |
|   (React+Zustand)| <--- SSE -------- |  (Controllers)   |
+------------------+                    +--------+---------+
                                                 |
                                        +--------+---------+
                                        |   Models + DB    |
                                        |   (Mongoose)     |
                                        +------------------+
```

## Data Flow

1. **고객 → 서버**: HTTP REST (주문 생성, 메뉴 조회, 주문 내역)
2. **관리자 → 서버**: HTTP REST (상태 변경, 메뉴 관리, 테이블 관리)
3. **서버 → 관리자**: SSE (신규 주문 알림, 상태 변경 알림)
4. **서버 → DB**: Mongoose ODM (MongoDB)

## Monorepo Package Dependencies

```
packages/
  shared/          ← SharedUI + SharedTypes (의존성 없음)
  customer-app/    ← depends on: shared
  admin-app/       ← depends on: shared
  server/          ← standalone (shared types는 서버 내부 정의)
```
