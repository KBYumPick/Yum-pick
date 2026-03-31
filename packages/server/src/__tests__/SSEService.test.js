const sseService = require('../services/SSEService');

describe('SSEService', () => {
  beforeEach(() => {
    // 매 테스트 전 클라이언트 맵 초기화
    sseService.clients.clear();
  });

  describe('addClient / removeClient', () => {
    test('클라이언트 추가 후 storeId별 Map에 저장된다', () => {
      const mockRes = { write: jest.fn() };
      sseService.addClient('store1', 'client1', mockRes);

      expect(sseService.clients.has('store1')).toBe(true);
      expect(sseService.clients.get('store1').has('client1')).toBe(true);
    });

    test('같은 storeId에 여러 클라이언트를 추가할 수 있다', () => {
      const mockRes1 = { write: jest.fn() };
      const mockRes2 = { write: jest.fn() };
      sseService.addClient('store1', 'client1', mockRes1);
      sseService.addClient('store1', 'client2', mockRes2);

      expect(sseService.clients.get('store1').size).toBe(2);
    });

    test('클라이언트 제거 후 Map에서 삭제된다', () => {
      const mockRes = { write: jest.fn() };
      sseService.addClient('store1', 'client1', mockRes);
      sseService.removeClient('store1', 'client1');

      // 마지막 클라이언트 제거 시 storeId 키도 삭제
      expect(sseService.clients.has('store1')).toBe(false);
    });

    test('여러 클라이언트 중 하나만 제거하면 나머지는 유지된다', () => {
      const mockRes1 = { write: jest.fn() };
      const mockRes2 = { write: jest.fn() };
      sseService.addClient('store1', 'client1', mockRes1);
      sseService.addClient('store1', 'client2', mockRes2);

      sseService.removeClient('store1', 'client1');

      expect(sseService.clients.get('store1').size).toBe(1);
      expect(sseService.clients.get('store1').has('client2')).toBe(true);
    });
  });

  describe('broadcast', () => {
    test('해당 storeId의 모든 클라이언트에게 이벤트를 전송한다', () => {
      const mockRes1 = { write: jest.fn() };
      const mockRes2 = { write: jest.fn() };
      sseService.addClient('store1', 'client1', mockRes1);
      sseService.addClient('store1', 'client2', mockRes2);

      sseService.broadcast('store1', {
        event: 'new_order',
        data: { _id: 'order1', status: 'pending' },
      });

      const expected = 'event: new_order\ndata: {"_id":"order1","status":"pending"}\n\n';
      expect(mockRes1.write).toHaveBeenCalledWith(expected);
      expect(mockRes2.write).toHaveBeenCalledWith(expected);
    });

    test('다른 storeId의 클라이언트에게는 이벤트를 전송하지 않는다 (BR-MONITOR-04)', () => {
      const mockRes1 = { write: jest.fn() };
      const mockRes2 = { write: jest.fn() };
      sseService.addClient('store1', 'client1', mockRes1);
      sseService.addClient('store2', 'client2', mockRes2);

      sseService.broadcast('store1', {
        event: 'new_order',
        data: { _id: 'order1' },
      });

      expect(mockRes1.write).toHaveBeenCalled();
      expect(mockRes2.write).not.toHaveBeenCalled();
    });

    test('연결된 클라이언트가 없으면 에러 없이 종료된다', () => {
      expect(() => {
        sseService.broadcast('nonexistent', {
          event: 'new_order',
          data: {},
        });
      }).not.toThrow();
    });

    test('write 실패 시 해당 클라이언트를 제거한다 (BR-MONITOR-06)', () => {
      const failRes = {
        write: jest.fn(() => {
          throw new Error('Connection closed');
        }),
      };
      const okRes = { write: jest.fn() };
      sseService.addClient('store1', 'fail-client', failRes);
      sseService.addClient('store1', 'ok-client', okRes);

      sseService.broadcast('store1', {
        event: 'order_status_updated',
        data: { _id: 'order1', status: 'preparing' },
      });

      // 실패한 클라이언트는 제거됨
      expect(sseService.clients.get('store1').has('fail-client')).toBe(false);
      // 정상 클라이언트는 유지됨
      expect(sseService.clients.get('store1').has('ok-client')).toBe(true);
      expect(okRes.write).toHaveBeenCalled();
    });
  });
});
