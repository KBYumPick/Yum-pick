# Unit of Work Plan - 냠픽(Yumpick)

## Plan

- [x] 5개 유닛 정의 및 책임 할당 (unit-of-work.md)
- [x] 유닛 간 의존성 매트릭스 생성 (unit-of-work-dependency.md)
- [x] 유닛별 기능 매핑 (unit-of-work-story-map.md)
- [x] Greenfield 코드 조직 전략 문서화
- [x] 유닛 경계 및 의존성 검증

---

## Questions

### Q1: 유닛 분배 전략
5명에게 작업을 나눌 때 어떤 기준으로 분배하시겠습니까?

A) 레이어별 분배 (백엔드 API, DB 모델, 고객앱, 관리자앱, 공유패키지)
B) 기능별 분배 (인증, 메뉴, 주문, 테이블관리, 대시보드)
C) 제가 최적으로 판단해서 분배 (AI 추천)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Q2: 작업 순서 제약
5명이 동시에 시작할 수 있어야 하나요, 아니면 일부 유닛이 먼저 완료된 후 시작해도 되나요?

A) 5명 모두 동시 시작 가능해야 함 (의존성 최소화)
B) 일부 순서 의존성 허용 (예: 공유 패키지 먼저)
X) Other (please describe after [Answer]: tag below)

[Answer]: A
