// 세션 관리 서비스
// Unit 5: 테이블 세션 종료 로직 (BR-TABLE-03)

import TableModel from '../models/TableModel';

class SessionService {
  /**
   * 테이블 세션 종료 (BR-TABLE-03)
   * - isActive를 false로 변경
   * - currentSessionId, sessionStartedAt을 null로 초기화
   * - 주문 데이터는 그대로 유지 (삭제하지 않음)
   *
   * @param tableId - 세션을 종료할 테이블 ID
   * @throws Error - 테이블 미존재 또는 이미 비활성 상태인 경우
   */
  async endSession(tableId: string): Promise<void> {
    // 1. 테이블 조회
    const table = await TableModel.findById(tableId);

    // 테이블이 존재하지 않는 경우
    if (!table) {
      throw new Error('테이블을 찾을 수 없습니다.');
    }

    // 이미 비활성 상태인 경우 (활성 세션 없음)
    if (!table.isActive) {
      throw new Error('활성 세션이 없는 테이블입니다.');
    }

    // 2. 테이블 상태 업데이트 (BR-TABLE-03)
    await TableModel.findByIdAndUpdate(tableId, {
      isActive: false,
      currentSessionId: null,
      sessionStartedAt: null,
    });

    // 3. 주문 데이터는 별도 처리 없음
    // - Order.sessionId가 종료된 세션 ID를 가리키므로
    //   과거 이력 조회 시 자동으로 필터링됨
  }
}

// 싱글톤 인스턴스로 export
const sessionService = new SessionService();
export default sessionService;
