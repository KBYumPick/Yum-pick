# Business Rules - Unit 1: 인증 (채원)

## BR-AUTH-01: JWT 토큰 만료 시간
- 모든 토큰(관리자/테이블)은 발급 후 **16시간** 후 만료
- 만료된 토큰으로 요청 시 401 Unauthorized 반환
- 토큰 갱신(refresh) 기능 없음 - 재로그인 필요

## BR-AUTH-02: 비밀번호 해싱
- 모든 비밀번호는 **bcrypt** (saltRounds: 10) 으로 해싱하여 저장
- 평문 비밀번호는 절대 저장하지 않음
- 비밀번호 비교는 bcrypt.compare() 사용

## BR-AUTH-03: 관리자 로그인 시도 제한
- 동일 storeId + username 조합으로 **5회 연속 실패** 시 **15분 잠금**
- 잠금 중 로그인 시도 시: "계정이 잠겼습니다. N분 후 다시 시도해주세요." 메시지 반환
- 로그인 성공 시 실패 카운트 초기화

## BR-AUTH-04: 테이블 로그인 시도 제한
- 동일 storeId + tableNumber 조합으로 **5회 연속 실패** 시 **15분 잠금**
- 관리자 로그인과 동일한 정책 적용

## BR-AUTH-05: 역할 기반 접근 제어
- `role: 'admin'` 토큰: 관리자 API 전체 접근 가능
- `role: 'table'` 토큰: 고객용 API만 접근 가능 (메뉴 조회, 주문 생성/조회)
- 역할 불일치 시 403 Forbidden 반환

## BR-AUTH-06: 테이블 세션 ID 생성
- 테이블 로그인 성공 시 항상 새 sessionId (UUID v4) 생성
- 기존 세션이 있어도 새 로그인 시 새 sessionId 발급
- sessionId는 JWT 페이로드에 포함

## BR-AUTH-07: 로컬 저장 자동 로그인 (고객앱)
- 초기 설정 성공 시 storeId, tableNumber, password를 localStorage에 저장
- 앱 로드 시 localStorage에 저장된 정보로 자동 로그인 시도
- 자동 로그인 실패(토큰 만료 등) 시 초기 설정 화면으로 이동

## BR-AUTH-08: storeId 검증
- 관리자 로그인: storeId가 DB에 존재하는지 검증
- 테이블 로그인: storeId + tableNumber 조합이 DB에 존재하는지 검증
- 존재하지 않는 storeId 요청 시 401 반환 (보안상 구체적 오류 메시지 노출 금지)
