/**
 * OrderController 단위 테스트
 * - BR-MONITOR-01: 주문 상태 단방향 전이
 * - BR-MONITOR-02: 주문 상태 변경 권한
 * - BR-MONITOR-03: 주문 삭제 규칙
 */

// Mock dependencies
jest.mock('../models/OrderModel');
jest.mock('../services/SSEService');

const Order = require('../models/OrderModel');
const sseService = require('../services/SSEService');
const OrderController = require('../controllers/OrderController');

// 헬퍼: mock req/res 생성
function createMockReqRes(overrides = {}) {
  const req = {
    params: {},
    body: {},
    user: { role: 'admin', storeId: 'store1' },
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('OrderController.updateStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  test('pending → preparing 전이 성공 (BR-MONITOR-01)', async () => {
    const mockOrder = {
      _id: 'order1',
      storeId: 'store1',
      tableId: 'table1',
      status: 'pending',
      save: jest.fn().mockResolvedValue({
        _id: 'order1',
        storeId: 'store1',
        status: 'preparing',
      }),
    };
    Order.findById.mockResolvedValue(mockOrder);

    const { req, res } = createMockReqRes({
      params: { id: 'order1' },
      body: { status: 'preparing' },
    });

    await OrderController.updateStatus(req, res);

    expect(mockOrder.status).toBe('preparing');
    expect(mockOrder.save).toHaveBeenCalled();
    expect(sseService.broadcast).toHaveBeenCalledWith('store1', {
      event: 'order_status_updated',
      data: expect.objectContaining({ status: 'preparing' }),
    });
    expect(res.json).toHaveBeenCalled();
  });

  test('preparing → completed 전이 성공 (BR-MONITOR-01)', async () => {
    const mockOrder = {
      _id: 'order1',
      storeId: 'store1',
      status: 'preparing',
      save: jest.fn().mockResolvedValue({
        _id: 'order1',
        storeId: 'store1',
        status: 'completed',
      }),
    };
    Order.findById.mockResolvedValue(mockOrder);

    const { req, res } = createMockReqRes({
      params: { id: 'order1' },
      body: { status: 'completed' },
    });

    await OrderController.updateStatus(req, res);

    expect(mockOrder.status).toBe('completed');
    expect(res.json).toHaveBeenCalled();
  });

  test('역방향 전이 거부: preparing → pending (BR-MONITOR-01)', async () => {
    const mockOrder = { _id: 'order1', storeId: 'store1', status: 'preparing' };
    Order.findById.mockResolvedValue(mockOrder);

    const { req, res } = createMockReqRes({
      params: { id: 'order1' },
      body: { status: 'pending' },
    });

    await OrderController.updateStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('유효하지 않은 상태 전이'),
      })
    );
  });

  test('completed 상태에서 전이 불가 (BR-MONITOR-01)', async () => {
    const mockOrder = { _id: 'order1', storeId: 'store1', status: 'completed' };
    Order.findById.mockResolvedValue(mockOrder);

    const { req, res } = createMockReqRes({
      params: { id: 'order1' },
      body: { status: 'pending' },
    });

    await OrderController.updateStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('동일 상태 전이 거부: pending → pending (BR-MONITOR-01)', async () => {
    const mockOrder = { _id: 'order1', storeId: 'store1', status: 'pending' };
    Order.findById.mockResolvedValue(mockOrder);

    const { req, res } = createMockReqRes({
      params: { id: 'order1' },
      body: { status: 'pending' },
    });

    await OrderController.updateStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('건너뛰기 전이 거부: pending → completed (BR-MONITOR-01)', async () => {
    const mockOrder = { _id: 'order1', storeId: 'store1', status: 'pending' };
    Order.findById.mockResolvedValue(mockOrder);

    const { req, res } = createMockReqRes({
      params: { id: 'order1' },
      body: { status: 'completed' },
    });

    await OrderController.updateStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('존재하지 않는 주문 → 404 (BR-MONITOR-02)', async () => {
    Order.findById.mockResolvedValue(null);

    const { req, res } = createMockReqRes({
      params: { id: 'nonexistent' },
      body: { status: 'preparing' },
    });

    await OrderController.updateStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('storeId 불일치 → 404 반환 (BR-MONITOR-02)', async () => {
    const mockOrder = { _id: 'order1', storeId: 'other-store', status: 'pending' };
    Order.findById.mockResolvedValue(mockOrder);

    const { req, res } = createMockReqRes({
      params: { id: 'order1' },
      body: { status: 'preparing' },
    });

    await OrderController.updateStatus(req, res);

    // 보안상 403이 아닌 404 반환
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('OrderController.deleteOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  test('주문 삭제 성공 + SSE 브로드캐스트 (BR-MONITOR-03)', async () => {
    const mockOrder = {
      _id: 'order1',
      storeId: 'store1',
      tableId: 'table1',
    };
    Order.findById.mockResolvedValue(mockOrder);
    Order.findByIdAndDelete.mockResolvedValue(mockOrder);

    const { req, res } = createMockReqRes({
      params: { id: 'order1' },
    });

    await OrderController.deleteOrder(req, res);

    expect(Order.findByIdAndDelete).toHaveBeenCalledWith('order1');
    expect(sseService.broadcast).toHaveBeenCalledWith('store1', {
      event: 'order_deleted',
      data: { orderId: 'order1', tableId: 'table1' },
    });
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test('존재하지 않는 주문 삭제 → 404', async () => {
    Order.findById.mockResolvedValue(null);

    const { req, res } = createMockReqRes({
      params: { id: 'nonexistent' },
    });

    await OrderController.deleteOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('storeId 불일치 → 404 반환 (BR-MONITOR-03)', async () => {
    const mockOrder = { _id: 'order1', storeId: 'other-store', tableId: 'table1' };
    Order.findById.mockResolvedValue(mockOrder);

    const { req, res } = createMockReqRes({
      params: { id: 'order1' },
    });

    await OrderController.deleteOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(Order.findByIdAndDelete).not.toHaveBeenCalled();
  });
});
