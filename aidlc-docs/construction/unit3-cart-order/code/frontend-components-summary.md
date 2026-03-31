# Frontend Components Summary - Unit 3

## 컴포넌트 목록

| 파일 | 역할 | Story |
|------|------|-------|
| CartBadge.tsx | 메뉴 화면 하단 고정 장바구니 버튼 | US-05 |
| CartComponent.tsx | 장바구니 슬라이드업 패널 | US-05, US-06 |
| CartItemRow.tsx | 장바구니 개별 항목 행 | US-05, US-06 |
| OrderConfirmModal.tsx | 주문 확인/성공 모달 (5초 카운트다운) | US-07 |
| OrderCard.tsx | 개별 주문 카드 (상태 뱃지 포함) | US-08 |
| OrderHistoryPage.tsx | 주문 내역 페이지 | US-08 |

## Store
- `customerStore.ts` - Zustand store (cart + order 슬라이스)
- localStorage 동기화 (키: `yumpick_cart`)

## API 서비스
- `orderApi.ts` - Axios 기반 (createOrder, listOrders, getOrder)

## 라우팅
- `/menu` → MenuPage (CartBadge, CartComponent 포함)
- `/orders` → OrderHistoryPage
