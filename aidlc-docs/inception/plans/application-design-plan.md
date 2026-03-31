# Application Design Plan - 냠픽(Yumpick)

## Design Plan

- [x] 컴포넌트 식별 및 정의 (components.md)
- [x] 컴포넌트 메서드 시그니처 정의 (component-methods.md)
- [x] 서비스 레이어 설계 (services.md)
- [x] 컴포넌트 의존성 관계 정의 (component-dependency.md)
- [x] 통합 설계 문서 생성 (application-design.md)
- [x] 설계 완전성 및 일관성 검증

---

## Design Questions

아래 질문에 [Answer]: 태그 뒤에 답변을 입력해 주세요.

### Q1: 백엔드 아키텍처 패턴
백엔드 코드 구조를 어떤 패턴으로 구성하시겠습니까?

A) Layered Architecture (Controller → Service → Repository) — 전통적이고 이해하기 쉬움
B) Clean Architecture (Use Case 중심, 의존성 역전) — 테스트 용이, 구조 복잡
C) Simple MVC — 빠른 개발, 소규모 프로젝트에 적합

[Answer]: C

### Q2: API 설계 스타일
REST API 경로 설계 스타일을 어떻게 하시겠습니까?

A) 리소스 중심 (예: `/api/stores/:storeId/menus`, `/api/stores/:storeId/orders`)
B) 기능 중심 (예: `/api/menu/list`, `/api/order/create`)

[Answer]: B

### Q3: 프론트엔드 상태 관리
React 앱의 상태 관리 방식을 어떻게 하시겠습니까?

A) React Context + useReducer (외부 라이브러리 없이)
B) Zustand (경량 상태 관리)
C) Redux Toolkit (대규모 상태 관리)

[Answer]: B

### Q4: 모노레포 vs 멀티레포
프로젝트 저장소 구조를 어떻게 하시겠습니까?

A) 모노레포 (백엔드 + 고객앱 + 관리자앱 하나의 저장소)
B) 멀티레포 (각각 별도 저장소)

[Answer]: A

### Q5: 고객용 앱과 관리자용 앱의 공통 컴포넌트
두 React 앱 간 공통 UI 컴포넌트(버튼, 카드 등)를 어떻게 관리하시겠습니까?

A) 공유 패키지로 분리 (모노레포 내 shared 패키지)
B) 각 앱에서 독립적으로 구현 (중복 허용, 단순함)

[Answer]: a
