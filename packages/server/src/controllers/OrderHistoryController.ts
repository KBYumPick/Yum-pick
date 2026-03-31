// 과거 주문 내역 조회 컨트롤러
// Unit 5: 과거 주문 조회 (US-15)
// ⚠️ OrderModel은 Unit 3 의존. 현재는 스텁 모델 사용.

import { Request, Response } from 'express';
import TableModel from '../models/TableModel';
// ⚠️ Unit 3 (장바구니/주문) 완성 시 실제 OrderModel로 자동 교체됩니다.
import OrderModel from '../models/OrderModel';

/** JWT 페이로드 타입 */
interface JwtPayload {
  storeId: string;
  role: string;
}

/**
 * 과거 주문 내역 조회 — GET /api/order/history
 * - 필수 쿼리: storeId, tableId
 * - 선택 쿼리: date (YYYY-MM-DD)
 * - storeId 소유권 확인 (BR-TABLE-08)
 * - 활성 세션 주문 제외 (BR-TABLE-05)
 * - createdAt 내림차순 정렬
 */
export const listHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeId, tableId, date } = req.query;
    const user = (req as any).user as JwtPayload;

    // 필수 파라미터 검증
    if (!storeId || !tableId) {
      res.status(400).json({ message: 'storeId와 tableId는 필수 파라미터입니다.' });
      return;
    }

    // BR-TABLE-08: storeId 소유권 확인
    if (user.storeId !== storeId) {
      res.status(403).json({ message: '해당 매장에 대한 접근 권한이 없습니다.' });
      return;
    }

    // 대상 테이블 조회
    const table = await TableModel.findById(tableId as string);
    if (!table) {
      res.status(404).json({ message: '테이블을 찾을 수 없습니다.' });
      return;
    }

    // 쿼리 조건 구성 (BR-TABLE-05)
    const query: Record<string, unknown> = {
      storeId: storeId as string,
      tableId: tableId as string,
    };

    // 활성 세션 주문 제외: 현재 활성 세션의 주문은 과거 이력에 포함하지 않음
    if (table.isActive && table.currentSessionId) {
      query.sessionId = { $ne: table.currentSessionId };
    }

    // 날짜 필터 (date 파라미터가 있을 때, UTC 기준)
    if (date && typeof date === 'string') {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    // 과거 주문 조회 (최신 주문 먼저)
    const orders = await OrderModel.find(query).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: '과거 주문 내역 조회 중 오류가 발생했습니다.' });
  }
};
