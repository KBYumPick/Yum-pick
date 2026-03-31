# 통합 가이드 - 냠픽(Yumpick)

## 현재 구현 상태

| 유닛 | 담당 | 백엔드 | 프론트엔드 | 상태 |
|------|------|--------|-----------|------|
| Unit1 인증 | 채원 | - | - | 미구현 |
| Unit2 메뉴 | 지승 | - | - | 미구현 |
| Unit3 장바구니/주문 | 유진 | - | - | 미구현 |
| Unit4 주문 모니터링 | 덕인 | ✅ | ✅ | 완료 |
| Unit5 테이블 관리 | 준형 | - | - | 미구현 |

## 백엔드 통합 (server/src/app.js)

각 유닛 담당자는 자신의 route 파일을 `routes/` 폴더에 작성한 후,
`app.js`에서 해당 주석을 해제하면 됩니다.

```
// 채원: routes/authRoutes.js → app.use('/api/auth', authRoutes)
// 지승: routes/menuRoutes.js → app.use('/api/menu', menuRoutes)
// 유진: routes/orderCreateRoutes.js → app.use('/api/order', orderCreateRoutes)
// 덕인: routes/orderRoutes.js ✅, routes/sseRoutes.js ✅
// 준형: routes/tableRoutes.js → app.use('/api/table', tableRoutes)
```

**주의**: 유진(Unit3)과 덕인(Unit4)은 둘 다 `/api/order` 경로를 사용합니다.
Express는 라우트를 순서대로 매칭하므로, 두 라우트 파일 모두 등록하면 됩니다.
- Unit3: POST /create, GET /list, GET /detail/:id
- Unit4: PUT /status/:id, DELETE /delete/:id

## 프론트엔드 통합 (admin-app/src/App.tsx)

각 유닛 담당자는 자신의 페이지 컴포넌트를 작성한 후,
`App.tsx`에서 해당 Route 주석을 해제하면 됩니다.

```
// 채원: /login → LoginPage
// 지승: /menu → MenuManagementPage
// 덕인: /dashboard → DashboardPage ✅
// 준형: /tables → TableManagementPage
```

## AdminStore 확장

`stores/adminStore.ts`에 각 유닛의 상태/액션을 추가합니다.
AdminState 인터페이스에 타입을 추가하고, create() 내부에 구현을 넣으면 됩니다.

## 공유 미들웨어

`middleware/auth.js`에 JWT 인증 + admin 권한 체크가 구현되어 있습니다.
채원(Unit1)이 최종 인증 로직을 완성하면 이 파일을 업데이트해주세요.

## 환경 변수 (.env)

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/yumpick
JWT_SECRET=yumpick-secret-key
```
