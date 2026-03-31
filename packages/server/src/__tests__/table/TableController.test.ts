// 테이블 컨트롤러 단위 테스트
// Unit 5: 테이블 관리 — 5개 핸들러 전체 테스트
// BR-TABLE-01 ~ BR-TABLE-08 비즈니스 규칙 검증

import { Request, Response } from 'express';

// 외부 의존성 mock
jest.mock('../../models/TableModel');
jest.mock('bcrypt');
jest.mock('../../services/SessionService');

import TableModel from '../../models/TableModel';
import bcrypt from 'bcrypt';
import sessionService from '../../services/SessionService';
import {
  listTables,
  createTable,
  updateTable,
  deleteTable,
  endSession,
} from '../../controllers/TableController';

const mockedTableModel = TableModel as jest.Mocked<typeof TableModel>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedSessionService = sessionService as jest.Mocked<typeof sessionService>;

/** req/res 헬퍼 생성 */
function mockReqRes(overrides: {
  query?: Record<string, any>;
  body?: Record<string, any>;
  params?: Record<string, any>;
  user?: { storeId: string; role: string };
}) {
  const req = {
    query: overrides.query ?? {},
    body: overrides.body ?? {},
    params: overrides.params ?? {},
    user: overrides.user ?? { storeId: 'store1', role: 'admin' },
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  return { req, res };
}

describe('TableController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // listTables — GET /api/table/list
  // ========================================
  describe('listTables', () => {
    // storeId 누락 → 400
    it('storeId 쿼리 파라미터 누락 시 400 반환', async () => {
      const { req, res } = mockReqRes({ query: {} });
      await listTables(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('storeId') })
      );
    });

    // storeId 불일치 → 403 (BR-TABLE-08)
    it('JWT storeId와 쿼리 storeId 불일치 시 403 반환', async () => {
      const { req, res } = mockReqRes({
        query: { storeId: 'other-store' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await listTables(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    // 정상 조회 → 200, tableNumber 오름차순 (BR-TABLE-07)
    it('정상 요청 시 200 + tableNumber 오름차순 정렬 결과 반환', async () => {
      const mockTables = [
        { tableNumber: 1, storeId: 'store1' },
        { tableNumber: 2, storeId: 'store1' },
      ];
      const sortMock = jest.fn().mockResolvedValue(mockTables);
      (mockedTableModel.find as jest.Mock).mockReturnValue({ sort: sortMock });

      const { req, res } = mockReqRes({
        query: { storeId: 'store1' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await listTables(req, res);

      expect(mockedTableModel.find).toHaveBeenCalledWith({ storeId: 'store1' });
      expect(sortMock).toHaveBeenCalledWith({ tableNumber: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTables);
    });
  });

  // ========================================
  // createTable — POST /api/table/create
  // ========================================
  describe('createTable', () => {
    // 정상 생성 → 201, bcrypt.hash 호출 (BR-TABLE-02)
    it('정상 요청 시 201 + bcrypt 해싱 후 테이블 생성', async () => {
      (mockedTableModel.findOne as jest.Mock).mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      const createdTable = { storeId: 'store1', tableNumber: 1, isActive: false };
      (mockedTableModel.create as jest.Mock).mockResolvedValue(createdTable);

      const { req, res } = mockReqRes({
        body: { storeId: 'store1', tableNumber: 1, password: 'plain' },
      });
      await createTable(req, res);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('plain', 10);
      expect(mockedTableModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          storeId: 'store1',
          tableNumber: 1,
          password: 'hashed-pw',
          isActive: false,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    // 중복 테이블 번호 → 400 (BR-TABLE-01)
    it('동일 매장 내 중복 tableNumber 시 400 반환', async () => {
      (mockedTableModel.findOne as jest.Mock).mockResolvedValue({ tableNumber: 1 });

      const { req, res } = mockReqRes({
        body: { storeId: 'store1', tableNumber: 1, password: 'pw' },
      });
      await createTable(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '이미 존재하는 테이블 번호입니다.' })
      );
    });

    // 필수 필드 누락 → 400
    it('필수 필드(password) 누락 시 400 반환', async () => {
      const { req, res } = mockReqRes({
        body: { storeId: 'store1', tableNumber: 1 },
      });
      await createTable(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('필수 필드(storeId) 누락 시 400 반환', async () => {
      const { req, res } = mockReqRes({
        body: { tableNumber: 1, password: 'pw' },
      });
      await createTable(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ========================================
  // updateTable — PUT /api/table/update/:id
  // ========================================
  describe('updateTable', () => {
    const existingTable = {
      _id: 'table-id-1',
      storeId: 'store1',
      tableNumber: 1,
      password: 'old-hashed',
      isActive: false,
    };

    // 정상 수정 → 200
    it('정상 수정 시 200 반환', async () => {
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(existingTable);
      (mockedTableModel.findOne as jest.Mock).mockResolvedValue(null); // 중복 없음
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');
      (mockedTableModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...existingTable,
        tableNumber: 2,
      });

      const { req, res } = mockReqRes({
        params: { id: 'table-id-1' },
        body: { tableNumber: 2, password: 'newpw' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await updateTable(req, res);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newpw', 10);
      expect(mockedTableModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'table-id-1',
        expect.objectContaining({ tableNumber: 2, password: 'new-hashed' }),
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    // 테이블 미존재 → 404
    it('테이블 미존재 시 404 반환', async () => {
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(null);

      const { req, res } = mockReqRes({
        params: { id: 'nonexistent' },
        body: { tableNumber: 2 },
        user: { storeId: 'store1', role: 'admin' },
      });
      await updateTable(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    // storeId 불일치 → 403 (BR-TABLE-08)
    it('storeId 불일치 시 403 반환', async () => {
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(existingTable);

      const { req, res } = mockReqRes({
        params: { id: 'table-id-1' },
        body: { tableNumber: 2 },
        user: { storeId: 'other-store', role: 'admin' },
      });
      await updateTable(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    // 중복 tableNumber → 400 (BR-TABLE-01)
    it('변경하려는 tableNumber가 이미 존재하면 400 반환', async () => {
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(existingTable);
      (mockedTableModel.findOne as jest.Mock).mockResolvedValue({ tableNumber: 2 }); // 중복 존재

      const { req, res } = mockReqRes({
        params: { id: 'table-id-1' },
        body: { tableNumber: 2 },
        user: { storeId: 'store1', role: 'admin' },
      });
      await updateTable(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '이미 존재하는 테이블 번호입니다.' })
      );
    });

    // 빈 password → 기존 비밀번호 유지 (BR-TABLE-06)
    it('password가 빈 문자열이면 기존 비밀번호 유지 (bcrypt.hash 미호출)', async () => {
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(existingTable);
      (mockedTableModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(existingTable);

      const { req, res } = mockReqRes({
        params: { id: 'table-id-1' },
        body: { password: '' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await updateTable(req, res);

      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('password 필드 미포함 시 기존 비밀번호 유지', async () => {
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(existingTable);
      (mockedTableModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(existingTable);

      const { req, res } = mockReqRes({
        params: { id: 'table-id-1' },
        body: { tableNumber: 3 },
        user: { storeId: 'store1', role: 'admin' },
      });
      // 중복 없음
      (mockedTableModel.findOne as jest.Mock).mockResolvedValue(null);

      await updateTable(req, res);

      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // deleteTable — DELETE /api/table/delete/:id
  // ========================================
  describe('deleteTable', () => {
    // 정상 삭제 → 200
    it('비활성 테이블 정상 삭제 시 200 반환', async () => {
      const inactiveTable = { _id: 'table-id-1', storeId: 'store1', isActive: false };
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(inactiveTable);
      (mockedTableModel.findByIdAndDelete as jest.Mock).mockResolvedValue(inactiveTable);

      const { req, res } = mockReqRes({
        params: { id: 'table-id-1' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await deleteTable(req, res);

      expect(mockedTableModel.findByIdAndDelete).toHaveBeenCalledWith('table-id-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    // 활성 세션 테이블 삭제 시도 → 400 (BR-TABLE-04)
    it('활성 세션이 있는 테이블 삭제 시 400 반환', async () => {
      const activeTable = { _id: 'table-id-1', storeId: 'store1', isActive: true };
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(activeTable);

      const { req, res } = mockReqRes({
        params: { id: 'table-id-1' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await deleteTable(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('이용 중인 테이블은 삭제할 수 없습니다'),
        })
      );
      expect(mockedTableModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    // 테이블 미존재 → 404
    it('테이블 미존재 시 404 반환', async () => {
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(null);

      const { req, res } = mockReqRes({
        params: { id: 'nonexistent' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await deleteTable(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ========================================
  // endSession — POST /api/table/end-session/:id
  // ========================================
  describe('endSession', () => {
    // 정상 세션 종료 → 200
    it('활성 세션 테이블의 세션 종료 시 200 반환', async () => {
      const activeTable = { _id: 'table-id-1', storeId: 'store1', isActive: true };
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(activeTable);
      (mockedSessionService.endSession as jest.Mock).mockResolvedValue(undefined);

      const { req, res } = mockReqRes({
        params: { id: 'table-id-1' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await endSession(req, res);

      expect(mockedSessionService.endSession).toHaveBeenCalledWith('table-id-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    // 비활성 테이블 세션 종료 시도 → 400 (BR-TABLE-03)
    it('비활성 테이블에 세션 종료 요청 시 400 반환', async () => {
      const inactiveTable = { _id: 'table-id-1', storeId: 'store1', isActive: false };
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(inactiveTable);

      const { req, res } = mockReqRes({
        params: { id: 'table-id-1' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await endSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: '활성 세션이 없는 테이블입니다.' })
      );
      expect(mockedSessionService.endSession).not.toHaveBeenCalled();
    });

    // 테이블 미존재 → 404
    it('테이블 미존재 시 404 반환', async () => {
      (mockedTableModel.findById as jest.Mock).mockResolvedValue(null);

      const { req, res } = mockReqRes({
        params: { id: 'nonexistent' },
        user: { storeId: 'store1', role: 'admin' },
      });
      await endSession(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
