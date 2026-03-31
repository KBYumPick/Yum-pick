# Application Design - 냠픽(Yumpick) 통합 설계 문서

## 1. 아키텍처 개요

- **패턴**: Simple MVC (Controller → Model → MongoDB)
- **API 스타일**: 기능 중심 REST (`/api/menu/list`, `/api/order/create`)
- **프론트엔드 상태**: Zustand
- **저장소**: 모노레포 (백엔드 + 고객앱 + 관리자앱 + 공유 패키지)
- **실시간**: SSE (관리자 화면만)

## 2. 모노레포 구조

```
yumpick/
  packages/
    server/           # Node.js + Express 백엔드
    customer-app/     # React 고객용 앱
    admin-app/        # React 관리자용 앱
    shared/           # 공통 UI 컴포넌트 + 타입
```

## 3. 백엔드 구조 (Simple MVC)

```
packages/server/
  src/
    controllers/      # AuthController, MenuController, OrderController, TableController, SSEController
    models/           # AuthModel, MenuModel, OrderModel, TableModel (Mongoose)
    services/         # SSEService, SessionService
    middleware/       # auth, errorHandler, validation
    routes/           # 라우트 정의
    app.js            # Express 앱 설정
    server.js         # 서버 시작
```

## 4. API 엔드포인트 요약

| 영역 | 엔드포인트 | 메서드 |
|------|-----------|--------|
| 인증 | /api/auth/admin/login | POST |
| 인증 | /api/auth/table/login | POST |
| 인증 | /api/auth/verify | GET |
| 메뉴 | /api/menu/list | GET |
| 메뉴 | /api/menu/detail/:id | GET |
| 메뉴 | /api/menu/create | POST |
| 메뉴 | /api/menu/update/:id | PUT |
| 메뉴 | /api/menu/delete/:id | DELETE |
| 메뉴 | /api/menu/reorder | PUT |
| 주문 | /api/order/create | POST |
| 주문 | /api/order/list | GET |
| 주문 | /api/order/detail/:id | GET |
| 주문 | /api/order/status/:id | PUT |
| 주문 | /api/order/delete/:id | DELETE |
| 주문 | /api/order/history | GET |
| 테이블 | /api/table/list | GET |
| 테이블 | /api/table/create | POST |
| 테이블 | /api/table/update/:id | PUT |
| 테이블 | /api/table/delete/:id | DELETE |
| 테이블 | /api/table/end-session/:id | POST |
| SSE | /api/sse/orders | GET |

## 5. 데이터 모델 요약

- **Menu**: storeId, name, price, description, category, imageUrl, sortOrder
- **Order**: storeId, tableId, sessionId, orderNumber, items[], totalAmount, status
- **Table**: storeId, tableNumber, password(hashed), currentSessionId, isActive
- **Admin**: storeId, username, password(hashed)

## 6. 프론트엔드 구조

```
packages/customer-app/
  src/
    pages/            # MenuPage, OrderHistoryPage
    components/       # CartComponent, MenuCard, OrderCard
    stores/           # customerStore (Zustand)
    services/         # api client, auth service
    App.tsx

packages/admin-app/
  src/
    pages/            # DashboardPage, TableManagementPage, MenuManagementPage, LoginPage
    components/       # OrderCard, TableCard, MenuForm
    stores/           # adminStore (Zustand)
    services/         # api client, auth service, sse service
    App.tsx

packages/shared/
  src/
    components/       # Button, Card, Modal, Input, Loading
    types/            # Menu, Order, Table, Store interfaces
```

## 7. 핵심 플로우

### 고객 주문 플로우
메뉴 조회 → 장바구니 추가 → 수량 조절 → 주문 확정 → 주문 번호 표시 → 메뉴 화면 복귀

### 관리자 주문 관리 플로우
SSE 연결 → 신규 주문 수신 → 상태 변경(대기중→준비중→완료) → 실시간 대시보드 업데이트

### 테이블 세션 플로우
테이블 생성 → 세션 시작(로그인) → 주문 수집 → 이용 완료(세션 종료) → 주문 이력 이동
