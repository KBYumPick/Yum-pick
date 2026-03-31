// 세션 서비스 단위 테스트
// Unit 5: 테이블 관리 — SessionService.endSession (BR-TABLE-03)

import TableModel from '../../models/TableModel';

// TableModel 전체 mock
jest.mock('../../models/TableModel');

// mock 후 import (싱글톤이므로 mock이 적용된 상태로 로드됨)
import sessionService from '../../services/SessionService';

const mockedTableModel = TableModel as jest.Mocked<typeof TableModel>;

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('endSession', () => {
    // --- 정상 세션 종료: isActive=true → false, null sessionId/startedAt ---
    it('활성 세션 테이블의 세션을 정상 종료함', async () => {
      const mockTable = {
        _id: 'table-id-1',
        storeId: 'store1',
        tableNumber: 1,
        isActive: true,
        currentSessionId: 'session-abc',
        sessionStartedAt: new Date(),
      };

      (mockedTableModel.findById as jest.Mock).mockResolvedValue(mockTable);
      (mockedTableModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await sessionService.endSession('table-id-1');

      // findById 호출 확인
      expect(mockedTableModel.findById).toHaveBeenCalledWith('table-id-1');

      // findByIdAndUpdate 호출 확인: isActive=false, null 값들
      expect(mockedTableModel.findByIdAndUpdate).toHaveBeenCalledWith('table-id-1', {
        isActive: false,
        currentSessionId: null,
        sessionStartedAt: null,
      });
    });

    // --- 테이블 미존재 시 에러 ---
    it('테이블이 존재하지 않으면 에러를 throw함', async () => {
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(sessionService.endSession('nonexistent-id')).rejects.toThrow(
        '테이블을 찾을 수 없습니다.'
      );
    });

    // --- 이미 비활성 테이블 시 에러 ---
    it('이미 비활성 상태인 테이블이면 에러를 throw함', async () => {
      const inactiveTable = {
        _id: 'table-id-2',
        isActive: false,
        currentSessionId: null,
        sessionStartedAt: null,
      };

      (mockedTableModel.findById as jest.Mock).mockResolvedValue(inactiveTable);

      await expect(sessionService.endSession('table-id-2')).rejects.toThrow(
        '활성 세션이 없는 테이블입니다.'
      );

      // findByIdAndUpdate는 호출되지 않아야 함
      expect(mockedTableModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });
});
