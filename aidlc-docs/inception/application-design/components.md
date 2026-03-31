# Components - 냠픽(Yumpick)

## Backend Components (Node.js + Express, Simple MVC)

### 1. AuthController
- **목적**: 인증 관련 HTTP 요청 처리
- **책임**: 관리자 로그인, 테이블 로그인, 토큰 검증
- **인터페이스**: REST API 엔드포인트

### 2. MenuController
- **목적**: 메뉴 관련 HTTP 요청 처리
- **책임**: 메뉴 CRUD, 카테고리별 조회, 순서 변경
- **인터페이스**: REST API 엔드포인트

### 3. OrderController
- **목적**: 주문 관련 HTTP 요청 처리
- **책임**: 주문 생성, 조회, 상태 변경, 삭제
- **인터페이스**: REST API 엔드포인트

### 4. TableController
- **목적**: 테이블 관련 HTTP 요청 처리
- **책임**: 테이블 CRUD, 세션 관리, 이용 완료 처리
- **인터페이스**: REST API 엔드포인트

### 5. SSEController
- **목적**: Server-Sent Events 연결 관리
- **책임**: 관리자 SSE 연결, 주문 이벤트 브로드캐스트
- **인터페이스**: SSE 엔드포인트

### 6. AuthModel
- **목적**: 관리자/테이블 인증 데이터 및 비즈니스 로직
- **책임**: JWT 생성/검증, 비밀번호 해싱/비교, 로그인 시도 제한

### 7. MenuModel
- **목적**: 메뉴 데이터 및 비즈니스 로직
- **책임**: 메뉴 MongoDB 스키마, 유효성 검증, 순서 관리

### 8. OrderModel
- **목적**: 주문 데이터 및 비즈니스 로직
- **책임**: 주문 MongoDB 스키마, 금액 계산, 상태 전이

### 9. TableModel
- **목적**: 테이블 데이터 및 비즈니스 로직
- **책임**: 테이블 MongoDB 스키마, 세션 라이프사이클

### 10. Middleware
- **목적**: 공통 미들웨어
- **책임**: JWT 인증 미들웨어, 에러 핸들링, 요청 유효성 검증

---

## Frontend Components - Customer App (React + Zustand)

### 11. MenuPage
- **목적**: 메뉴 조회 및 탐색 화면
- **책임**: 카테고리별 메뉴 표시, 메뉴 카드 렌더링, 장바구니 추가

### 12. CartComponent
- **목적**: 장바구니 관리 UI
- **책임**: 장바구니 표시, 수량 조절, 총액 계산, 주문 확정

### 13. OrderHistoryPage
- **목적**: 주문 내역 조회 화면
- **책임**: 현재 세션 주문 목록 표시, 주문 상태 표시

### 14. CustomerAuthService
- **목적**: 테이블 자동 로그인 관리
- **책임**: 로컬 저장 로그인 정보, 자동 인증, 세션 유지

### 15. CustomerStore (Zustand)
- **목적**: 고객앱 전역 상태 관리
- **책임**: 장바구니 상태, 메뉴 데이터, 주문 내역, 세션 정보

---

## Frontend Components - Admin App (React + Zustand)

### 16. DashboardPage
- **목적**: 실시간 주문 모니터링 대시보드
- **책임**: 테이블별 카드 그리드, SSE 연결, 주문 상태 변경

### 17. TableManagementPage
- **목적**: 테이블 관리 화면
- **책임**: 테이블 목록, 세션 종료, 과거 주문 조회

### 18. MenuManagementPage
- **목적**: 메뉴 관리 화면
- **책임**: 메뉴 CRUD 폼, 순서 조정, 카테고리 관리

### 19. AdminAuthService
- **목적**: 관리자 인증 관리
- **책임**: 로그인/로그아웃, JWT 토큰 관리, 세션 유지

### 20. AdminStore (Zustand)
- **목적**: 관리자앱 전역 상태 관리
- **책임**: 주문 데이터, 테이블 데이터, 메뉴 데이터, 인증 상태

---

## Shared Package

### 21. SharedUI
- **목적**: 공통 UI 컴포넌트
- **책임**: Button, Card, Modal, Input, Loading 등 공통 컴포넌트

### 22. SharedTypes
- **목적**: 공통 타입 정의
- **책임**: Menu, Order, Table, Store 등 TypeScript 인터페이스
