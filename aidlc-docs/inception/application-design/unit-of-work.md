# Unit of Work - 냠픽(Yumpick)

## 분배 전략
- **방식**: 기능별 분배 (풀스택 - 각 유닛이 백엔드 API + 프론트엔드 포함)
- **동시성**: 5명 모두 동시 시작 가능 (의존성 최소화)
- **공유 패키지**: 타입 인터페이스와 공통 UI는 각 유닛에서 독립 정의 후 마지막에 통합

---

## Unit 1: 인증 (Authentication)
- **담당**: 채원
- **범위**: 관리자 로그인 + 테이블 로그인 + 미들웨어
- **백엔드**: AuthController, AuthModel, Middleware (JWT, bcrypt)
- **프론트엔드(고객앱)**: 테이블 초기 설정 화면, 자동 로그인 로직, CustomerAuthService
- **프론트엔드(관리자앱)**: LoginPage, AdminAuthService
- **User Stories**: US-01, US-02, US-09

## Unit 2: 메뉴 (Menu)
- **담당**: 지승
- **범위**: 메뉴 조회(고객) + 메뉴 관리(관리자)
- **백엔드**: MenuController, MenuModel
- **프론트엔드(고객앱)**: MenuPage, MenuCard 컴포넌트
- **프론트엔드(관리자앱)**: MenuManagementPage, MenuForm 컴포넌트
- **User Stories**: US-03, US-04, US-16, US-17

## Unit 3: 장바구니 & 주문 생성 (Cart & Order Creation)
- **담당**: 유진
- **범위**: 장바구니 + 주문 생성 + 주문 내역 조회(고객)
- **백엔드**: OrderController (createOrder, listOrders, getOrder)
- **프론트엔드(고객앱)**: CartComponent, 주문 확인 화면, OrderHistoryPage, CustomerStore (cart/order 부분)
- **User Stories**: US-05, US-06, US-07, US-08

## Unit 4: 주문 모니터링 (Order Monitoring)
- **담당**: 덕인
- **범위**: 실시간 대시보드 + 주문 상태 변경 + 주문 삭제
- **백엔드**: OrderController (updateStatus, deleteOrder), SSEController, SSEService
- **프론트엔드(관리자앱)**: DashboardPage, OrderCard, SSE 연결 로직, AdminStore (orders 부분)
- **User Stories**: US-10, US-11, US-12

## Unit 5: 테이블 관리 (Table Management)
- **담당**: 준형
- **범위**: 테이블 CRUD + 세션 관리 + 과거 주문 조회
- **백엔드**: TableController, TableModel, SessionService, OrderController (listHistory)
- **프론트엔드(관리자앱)**: TableManagementPage, TableCard 컴포넌트, AdminStore (tables 부분)
- **User Stories**: US-13, US-14, US-15

---

## 코드 조직 전략 (Greenfield Monorepo)

```
yumpick/
  packages/
    server/
      src/
        controllers/    # 각 유닛 담당자가 자신의 controller 파일 작성
        models/         # 각 유닛 담당자가 자신의 model 파일 작성
        services/       # SSEService(Unit4), SessionService(Unit5)
        middleware/     # Unit1 담당
        routes/         # 각 유닛 담당자가 자신의 route 파일 작성
        app.js          # 통합 시 조립
        server.js
    customer-app/
      src/
        pages/          # Unit2(MenuPage), Unit3(OrderHistoryPage)
        components/     # Unit2(MenuCard), Unit3(CartComponent, OrderCard)
        stores/         # Unit3(customerStore)
        services/       # Unit1(authService), Unit2(menuApi), Unit3(orderApi)
    admin-app/
      src/
        pages/          # Unit1(LoginPage), Unit2(MenuManagementPage), Unit4(DashboardPage), Unit5(TableManagementPage)
        components/     # Unit2(MenuForm), Unit4(OrderCard), Unit5(TableCard)
        stores/         # Unit4(adminStore-orders), Unit5(adminStore-tables)
        services/       # Unit1(authService), Unit4(sseService)
    shared/
      src/
        types/          # 통합 시 각 유닛의 타입을 모아서 정리
        components/     # 통합 시 공통 UI 추출
```

## 동시 작업 가능 근거
- 각 유닛이 서로 다른 controller/model/page 파일을 담당하여 파일 충돌 없음
- 공유 타입은 각 유닛에서 로컬 정의 후 통합 단계에서 shared로 이동
- Express app.js의 라우트 등록은 각 유닛이 독립 route 파일을 만들고 마지막에 조립
