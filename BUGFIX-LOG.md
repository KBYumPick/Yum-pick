# 버그 수정 로그

## 서버 시작 실패 및 로그인 관련 버그 수정

### 수정된 문제들

1. **서버 시작 실패 — `Route.get() requires a callback function`**
   - 원인: `middleware/auth.js`(CommonJS)와 `middleware/auth.ts`(ESM)가 동시에 존재하여 `.js` 파일이 우선 로드됨. export 이름이 달라서 `authenticate`가 `undefined`로 해석됨.
   - 수정: 구버전 `auth.js` 삭제, `sseRoutes.js`의 import를 `authenticate`/`requireAdmin`으로 변경.

2. **서버 시작 실패 — `OverwriteModelError: Cannot overwrite Order model`**
   - 원인: `models/Order.js`, `models/OrderModel.js`, `models/OrderModel.ts` 세 파일이 모두 `Order` 모델을 등록.
   - 수정: 구버전 `.js` 파일 삭제, `OrderModel.ts`에 `generateOrderNumber` static 메서드 추가, `orderController.js`를 CommonJS로 변환하여 `OrderModel.ts` 참조.

3. **테이블 API 403 에러 — `관리자 권한이 필요합니다`**
   - 원인: `tableRoutes.ts`와 `orderHistoryRoutes.ts`에서 `authenticate` 미들웨어 없이 `requireAdmin`만 사용. `req.user`가 설정되지 않아 항상 권한 거부.
   - 수정: 모든 라우트에 `authenticate` → `requireAdmin` 순서로 미들웨어 적용.

4. **테이블 로그인 실패 — 비밀번호 비교 오류**
   - 원인: `authController.ts`의 `tableLogin`에서 `table.passwordHash` 필드를 참조했으나, `TableModel`의 실제 필드명은 `password`.
   - 수정: `table.passwordHash` → `table.password`로 변경.

5. **ESM/CommonJS 혼용 문제 정리**
   - `orderController.js`, `order.types.js`를 CommonJS(`require`/`module.exports`)로 통일.
   - macOS 대소문자 비구분 파일시스템에서 `OrderController.js`/`orderController.js` 충돌 정리.
