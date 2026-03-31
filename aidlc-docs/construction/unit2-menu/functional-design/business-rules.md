# Business Rules - Unit 2: 메뉴 (지승)

## BR-MENU-01: 가격 범위 검증
- 메뉴 가격은 **100원 이상 1,000,000원 이하**
- 위반 시 400 Bad Request: "가격은 100원 ~ 1,000,000원 사이여야 합니다."

## BR-MENU-02: 필수 필드 검증
- name, price, category는 필수
- name: 공백만으로 구성 불가, 최대 100자
- category: 공백만으로 구성 불가, 최대 50자
- description: 최대 500자 (선택)
- imageUrl: URL 형식 검증 (선택, http:// 또는 https:// 시작)

## BR-MENU-03: 매장 격리
- 모든 메뉴 조회/수정/삭제는 JWT의 storeId와 메뉴의 storeId가 일치해야 함
- 다른 매장 메뉴 접근 시 404 반환 (보안상 403 대신 404)

## BR-MENU-04: sortOrder 자동 부여
- 신규 메뉴 등록 시 해당 매장의 현재 최대 sortOrder + 1 자동 부여
- 첫 번째 메뉴: sortOrder = 0

## BR-MENU-05: 순서 변경 원자성
- reorder 요청 시 menuIds 배열의 모든 ID가 해당 storeId 소속인지 검증
- 검증 실패 시 전체 롤백 (일부만 변경 불가)
- menuIds 배열 길이 = 해당 매장 전체 메뉴 수여야 함

## BR-MENU-06: 메뉴 삭제 시 주문 데이터 보존
- 메뉴 삭제 시 기존 주문의 items는 영향 없음
- 주문 items에는 menuName, unitPrice를 스냅샷으로 저장하므로 메뉴 삭제와 무관

## BR-MENU-07: 메뉴 조회 정렬
- 고객앱 메뉴 조회: sortOrder 오름차순 정렬
- 카테고리 필터 적용 시 해당 카테고리 내에서 sortOrder 정렬
