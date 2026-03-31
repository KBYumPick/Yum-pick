import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Order model
const mockCreate = jest.fn();
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockGenerateOrderNumber = jest.fn();

jest.unstable_mockModule('../../models/Order.js', () => ({
  default: {
    create: mockCreate,
    find: (...args) => ({ sort: (s) => mockFind(...args, s) }),
    findById: mockFindById,
    generateOrderNumber: mockGenerateOrderNumber,
  },
}));

const { createOrder, listOrders, getOrder } = await import('../orderController.js');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('createOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = {
    storeId: 'store1',
    tableId: 'table1',
    sessionId: 'session1',
    items: [{ menuName: '김치찌개', quantity: 2, unitPrice: 8000 }],
    totalAmount: 16000,
  };

  it('정상 주문 생성 시 201 반환', async () => {
    const req = { body: validBody, user: { sessionId: 'session1', storeId: 'store1' } };
    const res = mockRes();
    mockGenerateOrderNumber.mockResolvedValue('20260331-001');
    mockCreate.mockResolvedValue({ ...validBody, orderNumber: '20260331-001', status: 'pending' });

    await createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('빈 items 시 400 반환 (BR-ORDER-01)', async () => {
    const req = { body: { ...validBody, items: [] }, user: { sessionId: 'session1' } };
    const res = mockRes();
    await createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('totalAmount 불일치 시 400 반환 (BR-ORDER-02)', async () => {
    const req = { body: { ...validBody, totalAmount: 99999 }, user: { sessionId: 'session1' } };
    const res = mockRes();
    await createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('수량 범위 초과 시 400 반환 (BR-ORDER-03)', async () => {
    const req = {
      body: { ...validBody, items: [{ menuName: 'A', quantity: 100, unitPrice: 1000 }], totalAmount: 100000 },
      user: { sessionId: 'session1' },
    };
    const res = mockRes();
    await createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sessionId 불일치 시 401 반환 (BR-ORDER-04)', async () => {
    const req = { body: validBody, user: { sessionId: 'wrong-session' } };
    const res = mockRes();
    await createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('listOrders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('쿼리 파라미터로 필터링하여 주문 목록 반환', async () => {
    const req = { query: { storeId: 'store1', sessionId: 'session1' } };
    const res = mockRes();
    const mockOrders = [{ orderNumber: '20260331-001' }];
    mockFind.mockResolvedValue(mockOrders);

    await listOrders(req, res);
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });
});

describe('getOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('존재하는 주문 반환', async () => {
    const order = { _id: 'id1', storeId: 'store1', orderNumber: '20260331-001' };
    mockFindById.mockResolvedValue(order);
    const req = { params: { id: 'id1' }, user: { storeId: 'store1' } };
    const res = mockRes();

    await getOrder(req, res);
    expect(res.json).toHaveBeenCalledWith(order);
  });

  it('존재하지 않는 주문 시 404 반환', async () => {
    mockFindById.mockResolvedValue(null);
    const req = { params: { id: 'nonexistent' }, user: { storeId: 'store1' } };
    const res = mockRes();

    await getOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
