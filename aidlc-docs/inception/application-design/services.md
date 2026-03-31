# Services - 냠픽(Yumpick)

Simple MVC 패턴이므로 별도 서비스 레이어 없이 Controller에서 Model을 직접 호출합니다.
다만 다음 공통 서비스가 필요합니다.

## 1. SSEService
- **목적**: SSE 연결 관리 및 이벤트 브로드캐스트
- **책임**:
  - 관리자 SSE 클라이언트 연결 관리 (storeId별)
  - 신규 주문 이벤트 브로드캐스트
  - 주문 상태 변경 이벤트 브로드캐스트
  - 주문 삭제 이벤트 브로드캐스트
  - 연결 해제 시 클린업
- **호출자**: OrderController (주문 생성/상태변경/삭제 시)

## 2. SessionService
- **목적**: 테이블 세션 라이프사이클 관리
- **책임**:
  - 세션 ID 생성 (테이블 로그인 시)
  - 세션 종료 처리 (이용 완료 시)
  - 세션별 주문 그룹화
- **호출자**: AuthController (로그인 시), TableController (세션 종료 시)

## Orchestration Patterns

```
[고객 주문 플로우]
CustomerApp → OrderController.createOrder → OrderModel.save → SSEService.broadcast → AdminApp

[관리자 상태 변경 플로우]
AdminApp → OrderController.updateStatus → OrderModel.update → SSEService.broadcast → AdminApp(다른 탭)

[테이블 세션 종료 플로우]
AdminApp → TableController.endSession → SessionService.endSession → TableModel.update + OrderModel(이력 이동)
```
