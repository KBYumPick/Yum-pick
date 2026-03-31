# Requirements Verification Questions

요구사항 문서를 분석한 결과, 다음 사항들에 대한 확인이 필요합니다.
각 질문의 [Answer]: 태그 뒤에 선택한 옵션 문자를 입력해 주세요.

---

## Question 1
백엔드 기술 스택으로 어떤 것을 사용하시겠습니까?

A) Node.js + Express (JavaScript/TypeScript)
B) Spring Boot (Java/Kotlin)
C) FastAPI / Django (Python)
D) Go (Gin/Echo)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
프론트엔드 기술 스택으로 어떤 것을 사용하시겠습니까?

A) React (JavaScript/TypeScript)
B) Vue.js
C) Next.js (React 기반 풀스택)
D) Svelte / SvelteKit
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
데이터베이스로 어떤 것을 사용하시겠습니까?

A) PostgreSQL (관계형)
B) MySQL (관계형)
C) DynamoDB (NoSQL)
D) MongoDB (NoSQL)
X) Other (please describe after [Answer]: tag below)

[Answer]: D

## Question 4
배포 환경은 어떻게 계획하고 계십니까?

A) AWS 클라우드 (EC2, ECS, Lambda 등)
B) 로컬/온프레미스 서버
C) Docker 컨테이너 기반 (Docker Compose)
D) 서버리스 (AWS Lambda + API Gateway)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
고객용 인터페이스와 관리자용 인터페이스를 어떻게 구성하시겠습니까?

A) 하나의 프론트엔드 앱에서 라우팅으로 분리
B) 별도의 프론트엔드 앱 2개 (고객용 / 관리자용)
C) 고객용은 모바일 웹, 관리자용은 별도 SPA
X) Other (please describe after [Answer]: tag below)

[Answer]: B 

## Question 6
메뉴 이미지 관리는 어떻게 하시겠습니까? (요구사항에 이미지 URL이 포함되어 있습니다)

A) 외부 이미지 URL 직접 입력 (별도 업로드 없음)
B) S3 등 클라우드 스토리지에 이미지 업로드 후 URL 자동 생성
C) 서버 로컬 파일 시스템에 업로드
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
매장(Store) 관리 범위는 어떻게 되나요? MVP에서 지원할 매장 수는?

A) 단일 매장만 지원 (MVP)
B) 다중 매장 지원 (멀티테넌트)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 8
관리자 계정 관리 범위는 어떻게 되나요?

A) 매장당 관리자 1명 (고정 계정)
B) 매장당 다수 관리자 (역할 구분 없음)
C) 매장당 다수 관리자 (역할별 권한 구분: 매니저, 직원 등)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 9
주문 상태 실시간 업데이트(SSE)는 고객 화면에서도 필요합니까?

A) 관리자 화면에서만 SSE 사용 (고객은 수동 새로고침 또는 폴링)
B) 관리자 + 고객 화면 모두 SSE 사용
X) Other (please describe after [Answer]: tag below)

[Answer]: x 다 수동 

## Question 10
프로젝트의 언어(코드 주석, 변수명 등)는 어떻게 하시겠습니까?

A) 영어 (코드, 주석, 변수명 모두 영어)
B) 한국어 주석 + 영어 코드/변수명
X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 11: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 12: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)
C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

# ⚠️ Clarification Required

Q9 답변과 요구사항 문서 간에 모순이 발견되었습니다.

## Contradiction: SSE 사용 범위 vs 요구사항 명세

**Q9 답변**: "다 수동" (관리자/고객 모두 SSE 미사용)

**요구사항 문서 (3.2.2 실시간 주문 모니터링)**:
> - "주문 목록 실시간 업데이트 (Server-Sent Events 사용)"
> - "Server-Sent Events (SSE) 기반 실시간 통신"
> - "2초 이내 주문 표시"

### Clarification Question 1
관리자 주문 모니터링 화면의 실시간 업데이트 방식을 어떻게 하시겠습니까?

A) 요구사항대로 SSE 사용 (관리자 화면만 SSE, 고객 화면은 수동)
B) SSE 대신 폴링 사용 (관리자 화면에서 일정 간격으로 서버에 요청)
C) 모두 수동 새로고침 (관리자가 직접 새로고침 버튼 클릭)
X) Other (please describe after [Answer]: tag below)

[Answer]: A
