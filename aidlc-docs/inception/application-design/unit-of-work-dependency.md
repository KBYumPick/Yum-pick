# Unit of Work Dependencies - 냠픽(Yumpick)

## Dependency Matrix

| | Unit1 인증 | Unit2 메뉴 | Unit3 장바구니&주문 | Unit4 주문모니터링 | Unit5 테이블관리 |
|---|:---:|:---:|:---:|:---:|:---:|
| Unit1 인증 | - | 없음 | 없음 | 없음 | 없음 |
| Unit2 메뉴 | 없음 | - | 없음 | 없음 | 없음 |
| Unit3 장바구니&주문 | 없음 | 없음 | - | 없음 | 없음 |
| Unit4 주문모니터링 | 없음 | 없음 | 없음 | - | 없음 |
| Unit5 테이블관리 | 없음 | 없음 | 없음 | 없음 | - |

## 통합 시 의존성 (개발 완료 후)

| 통합 포인트 | 관련 유닛 | 설명 |
|------------|----------|------|
| JWT 미들웨어 | Unit1 → Unit2,3,4,5 | Unit1이 만든 auth 미들웨어를 다른 유닛 라우트에 적용 |
| OrderModel 공유 | Unit3 ↔ Unit4 | 같은 Order 스키마 사용 (통합 시 하나로 병합) |
| OrderModel 공유 | Unit3 ↔ Unit5 | Unit5의 과거 주문 조회가 Order 컬렉션 참조 |
| SSE 이벤트 | Unit3 → Unit4 | 주문 생성 시 SSE 브로드캐스트 트리거 |
| SessionService | Unit1 ↔ Unit5 | 세션 생성(로그인)과 세션 종료(이용완료) |
| app.js 라우트 조립 | All | 각 유닛의 route 파일을 app.js에 등록 |
| Zustand Store 병합 | Unit3 ↔ Unit4,5 | 관리자앱 store를 하나로 통합 |

## 개발 중 독립성 보장 방법

- 각 유닛은 자체 mock/stub으로 다른 유닛 의존성 대체
- Unit3: 인증 없이 개발 (테스트 시 mock token 사용)
- Unit4: 주문 데이터를 직접 생성하여 SSE 테스트
- Unit5: 세션 ID를 직접 생성하여 테이블 관리 테스트
- 통합 단계에서 mock을 실제 구현으로 교체
