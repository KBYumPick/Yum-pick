# Business Rules - Unit 5: 테이블 관리 (준형)

## BR-TABLE-01: 테이블 번호 중복 방지

- 동일 `storeId` 내에서 `tableNumber`는 고유해야 함
- 테이블 등록 시: 동일 storeId + tableNumber 조합이 이미 존재하면 400 Bad Request 반환
  - 오류 메시지: "이미 존재하는 테이블 번호입니다."
- 테이블 수정 시: 변경하려는 tableNumber가 다른 테이블에서 사용 중이면 400 반환
- DB 레벨에서도 `{ storeId, tableNumber }` unique 복합 인덱스로 이중 보호

---

## BR-TABLE-02: 비밀번호 bcrypt 해싱

- 테이블 비밀번호는 **bcrypt** (saltRounds: 10)으로 해싱하여 저장
- 평문 비밀번호는 DB에 절대 저장하지 않음
- 비밀번호 검증은 `bcrypt.compare()` 사용 (Unit 1 AuthController와 동일 방식)
- API 응답에서 `password` 필드는 절대 포함하지 않음 (응답 시 제거)

---

## BR-TABLE-03: 세션 종료 규칙

세션 종료(`POST /api/table/end-session/:id`) 처리 시:

1. `Table.isActive = false`
2. `Table.currentSessionId = null`
3. `Table.sessionStartedAt = null`
4. 해당 테이블의 주문 데이터는 **그대로 유지** (삭제하지 않음)
   - 주문의 `sessionId`가 종료된 세션 ID를 가리키게 되어 과거 이력으로 조회 가능
5. 이미 `isActive=false`인 테이블에 세션 종료 요청 시: 400 Bad Request 반환
   - 오류 메시지: "활성 세션이 없는 테이블입니다."

---

## BR-TABLE-04: 활성 세션이 있는 테이블 삭제 방지

- `isActive=true`인 테이블(고객 이용 중)은 **삭제 불가**
- 삭제 시도 시 400 Bad Request 반환
  - 오류 메시지: "이용 중인 테이블은 삭제할 수 없습니다. 먼저 세션을 종료해주세요."
- `isActive=false`인 테이블은 삭제 가능 (과거 주문 데이터는 orphan으로 남음, MVP 허용)

---

## BR-TABLE-05: 과거 주문 조회 범위

- 조회 대상: 해당 테이블(`tableId`)에서 **종료된 세션**의 주문만 포함
  - 종료된 세션 = 현재 `Table.currentSessionId`가 아닌 sessionId를 가진 주문
  - 구현 방식: `Table.isActive=false` 또는 `Order.sessionId != Table.currentSessionId` 조건
- 현재 활성 세션의 주문은 과거 이력에 포함하지 않음
- 날짜 필터(`date` 파라미터): 해당 날짜의 `00:00:00 ~ 23:59:59` (UTC 기준) 범위 적용
- 정렬: `createdAt` 내림차순 (최신 주문 먼저)
- `storeId`와 `tableId` 모두 필수 파라미터

---

## BR-TABLE-06: 테이블 수정 시 비밀번호 변경 규칙

- `PUT /api/table/update/:id` 요청에서 `password` 필드는 **선택 사항**
- `password` 필드가 포함된 경우: 새 비밀번호를 bcrypt 해싱 후 저장
- `password` 필드가 없거나 빈 문자열인 경우: 기존 비밀번호 유지 (변경하지 않음)
- `tableNumber` 변경 시 BR-TABLE-01 중복 검증 적용
- `isActive`, `currentSessionId`, `sessionStartedAt`은 수정 API로 변경 불가 (세션 종료 API 전용)

---

## BR-TABLE-07: 테이블 목록 정렬

- `GET /api/table/list?storeId=` 응답은 `tableNumber` 오름차순 정렬
- 관리자 대시보드 기본 정렬 기준과 일치

---

## BR-TABLE-08: storeId 소유권 검증

- 모든 테이블 CRUD 요청은 JWT 토큰의 `storeId`와 대상 테이블의 `storeId`가 일치해야 함
- 불일치 시 403 Forbidden 반환
- 다른 매장의 테이블에 접근하거나 수정할 수 없음
