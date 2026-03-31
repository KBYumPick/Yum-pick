# Business Rules - Unit 4: 주문 모니터링 (덕인)

## BR-MONITOR-01: 주문 상태 단방향 전이
- 주문 상태는 `pending → preparing → completed` 순서로만 변경 가능
- 역방향 전이 불가 (completed → preparing, preparing → pending 금지)
- 동일 상태로의 변경 불가 (pending → pending 금지)
- 위반 시 400 Bad Request: "유효하지 않은 상태 전이입니다. (현재: {current}, 요청: {requested})"
- completed 상태의 주문은 더 이상 상태 변경 불가

## BR-MONITOR-02: 주문 상태 변경 권한
- 주문 상태 변경은 `role: 'admin'` 토큰 보유자만 가능
- JWT의 storeId와 주문의 storeId가 일치해야 함
- 불일치 시 404 반환 (보안상 403 대신 404)

## BR-MONITOR-03: 주문 삭제 규칙
- 주문 삭제는 `role: 'admin'` 토큰 보유자만 가능
- JWT의 storeId와 주문의 storeId가 일치해야 함
- 삭제 전 프론트엔드에서 확인 팝업 필수 표시 ("이 주문을 삭제하시겠습니까?")
- 삭제 후 해당 테이블의 총 주문액 프론트엔드에서 즉시 재계산
- 삭제 후 SSE로 `order_deleted` 이벤트 브로드캐스트

## BR-MONITOR-04: SSE 연결 storeId별 격리
- SSE 연결은 storeId 단위로 격리 관리
- 특정 매장의 이벤트는 해당 storeId로 연결된 클라이언트에게만 전송
- 다른 매장의 이벤트는 절대 수신 불가
- SSE 구독 시 JWT 인증 필수 (Authorization 헤더 또는 query param token)

## BR-MONITOR-05: SSE 이벤트 전달 시간
- 주문 생성/상태변경/삭제 발생 후 **2초 이내** SSE 이벤트 전달
- 이벤트 브로드캐스트는 DB 작업 완료 직후 동기적으로 수행

## BR-MONITOR-06: SSE 연결 해제 클린업
- 클라이언트 연결 해제(브라우저 닫기, 네트워크 끊김) 시 즉시 Map에서 제거
- Express Response의 `close` 이벤트로 감지
- 연결 해제된 클라이언트에게 이벤트 전송 시도 금지

## BR-MONITOR-07: 대시보드 기본 정렬
- 대시보드 테이블 카드는 **테이블 번호 오름차순** 기본 정렬
- 테이블 필터 적용 시 해당 테이블 카드만 표시

## BR-MONITOR-08: 대시보드 총액 계산
- 테이블별 총 주문액 = 해당 테이블의 현재 세션 주문 totalAmount 합계
- 주문 삭제 시 해당 주문의 totalAmount를 총액에서 차감하여 재계산
- 계산은 프론트엔드 AdminStore에서 수행 (서버 집계 없음)

## BR-MONITOR-09: 신규 주문 시각적 강조
- SSE로 `new_order` 이벤트 수신 시 해당 테이블 카드에 시각적 강조 적용
- 강조 표시: 색상 변경 + CSS 애니메이션 (예: pulse 효과)
- 강조 지속 시간: 관리자가 해당 카드를 클릭하거나 일정 시간(예: 30초) 경과 시 해제
