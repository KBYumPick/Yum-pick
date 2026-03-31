// 과거 주문 내역 조회 컨트롤러 단위 테스트
// Unit 5: 테이블 관리 — listHistory (BR-TABLE-05, BR-TABLE-08)

import { Request, Response } from 'express';

// 외부 의존성 mock
jest.mock('../../models/TableModel');
jest.mock('../../models/OrderModel');

import TableModel from '../../models/TableModel';
import OrderModel from '../../models/OrderModel';
import { listHistory } from '../../controllers/OrderHistoryController';

const mockedTableModel = TableModel as jest.Mocked<typeof TableModel>;
const mockedOrderModel = OrderModel as jest.Mocked<typeof OrderModel>;

/** req/res 헬퍼 생성 */
function mockReqRes(overrides: {
  query?: Record<string, any>;
  user?: { storeId: string; role: string };
}) {
  const req = {
    query: overrides.query ?? {},
    user: overrides.user ?? { storeId: 'store1', role: 'admin' },
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  return { req, res };
}

describe('OrderHistoryController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listHistory', () => {
    // --- 필수 파라미터 누락 → 400 ---
    it('storeId 누락 시 400 반환', async () => {
      const { req, res } = mockReqRes({ query: { tableId: 'table1' } });
      await listHistory(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('storeId') })
      );
    });

    it('tableId 누락 시 400 반환', async () => {
      const { req, res } = mockReqRes({ query: { storeId: 'store1' } });
      await listHistory(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    // --- storeId 불일치 → 403 (BR-TABLE-08) ---
    it('JWT storeId와 쿼리 storeId 불일치 시 403 반환', async () => {
      const { req, res } = mockReqRes({
        query: { storeId: 'other-store', tableId: 'table1' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await listHistory(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    // --- 테이블 미존재 → 404 ---
    it('테이블 미존재 시 404 반환', async () => {
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(null);

      const { req, res } = mockReqRes({
        query: { storeId: 'store1', tableId: 'nonexistent' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await listHistory(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    // --- 정상 조회: 활성 세션 주문 제외 (BR-TABLE-05) ---
    it('활성 세션이 있는 테이블 조회 시 현재 세션 주문 제외', async () => {
      const activeTable = {
        _id: 'table1',
        storeId: 'store1',
        isActive: true,
        currentSessionId: 'current-session',
      };
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(activeTable);

      const mockOrders = [{ orderNumber: 'ORD-001' }];
      const sortMock = jest.fn().mockResolvedValue(mockOrders);
      (mockedOrderModel.find as jest.Mock).mockReturnValue({ sort: sortMock });

      const { req, res } = mockReqRes({
        query: { storeId: 'store1', tableId: 'table1' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await listHistory(req, res);

      // 활성 세션 주문 제외 조건 확인
      expect(mockedOrderModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          storeId: 'store1',
          tableId: 'table1',
          sessionId: { $ne: 'current-session' },
        })
      );
      // createdAt 내림차순 정렬
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    // --- 비활성 테이블: sessionId 필터 없이 전체 조회 ---
    it('비활성 테이블 조회 시 sessionId 필터 없이 전체 주문 반환', async () => {
      const inactiveTable = {
        _id: 'table1',
        storeId: 'store1',
        isActive: false,
        currentSessionId: null,
      };
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(inactiveTable);

      const sortMock = jest.fn().mockResolvedValue([]);
      (mockedOrderModel.find as jest.Mock).mockReturnValue({ sort: sortMock });

      const { req, res } = mockReqRes({
        query: { storeId: 'store1', tableId: 'table1' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await listHistory(req, res);

      // sessionId 필터가 없어야 함
      const findArg = (mockedOrderModel.find as jest.Mock).mock.calls[0][0];
      expect(findArg).not.toHaveProperty('sessionId');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    // --- 날짜 필터 적용 (BR-TABLE-05) ---
    it('date 파라미터 전달 시 해당 날짜 범위 필터 적용', async () => {
      const inactiveTable = {
        _id: 'table1',
        storeId: 'store1',
        isActive: false,
        currentSessionId: null,
      };
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(inactiveTable);

      const sortMock = jest.fn().mockResolvedValue([]);
      (mockedOrderModel.find as jest.Mock).mockReturnValue({ sort: sortMock });

      const { req, res } = mockReqRes({
        query: { storeId: 'store1', tableId: 'table1', date: '2024-06-15' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await listHistory(req, res);

      // 날짜 필터 확인 (UTC 기준 00:00:00 ~ 23:59:59)
      const findArg = (mockedOrderModel.find as jest.Mock).mock.calls[0][0];
      expect(findArg.createdAt).toBeDefined();
      expect(findArg.createdAt.$gte).toEqual(new Date('2024-06-15T00:00:00.000Z'));
      expect(findArg.createdAt.$lte).toEqual(new Date('2024-06-15T23:59:59.999Z'));
    });

    // --- 정렬: createdAt 내림차순 ---
    it('결과가 createdAt 내림차순으로 정렬됨', async () => {
      const table = {
        _id: 'table1',
        storeId: 'store1',
        isActive: false,
        currentSessionId: null,
      };
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(table);

      const sortMock = jest.fn().mockResolvedValue([]);
      (mockedOrderModel.find as jest.Mock).mockReturnValue({ sort: sortMock });

      const { req, res } = mockReqRes({
        query: { storeId: 'store1', tableId: 'table1' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await listHistory(req, res);

      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });
});
