# Requirements Clarification Questions

Q9 답변과 요구사항 문서 간에 모순이 발견되어 확인이 필요합니다.

---

## Contradiction 1: SSE 사용 범위 vs 요구사항 명세

Q9에서 "다 수동"을 선택하셨습니다 (관리자/고객 모두 SSE 미사용).
그러나 요구사항 문서(3.2.2 실시간 주문 모니터링)에는 다음이 명시되어 있습니다:
- "주문 목록 실시간 업데이트 (Server-Sent Events 사용)"
- "Server-Sent Events (SSE) 기반 실시간 통신"
- "2초 이내 주문 표시"

### Clarification Question 1
관리자 주문 모니터링 화면의 실시간 업데이트 방식을 어떻게 하시겠습니까?

A) 요구사항대로 SSE 사용 (관리자 화면만 SSE, 고객 화면은 수동)
B) SSE 대신 폴링 사용 (관리자 화면에서 일정 간격으로 서버에 요청)
C) 모두 수동 새로고침 (관리자가 직접 새로고침 버튼 클릭)
X) Other (please describe after [Answer]: tag below)

[Answer]: 
