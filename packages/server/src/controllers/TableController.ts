// 테이블 CRUD + 세션 종료 컨트롤러
// Unit 5: 테이블 관리 (US-13, US-14)

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import TableModel from '../models/TableModel';
import sessionService from '../services/SessionService';

/** JWT 페이로드 타입 (req.user에 설정됨) */
interface JwtPayload {
  storeId: string;
  role: string;
}

/**
 * 테이블 목록 조회 — GET /api/table/list?storeId=
 * - storeId 쿼리 파라미터 필수 (BR-TABLE-08)
 * - JWT storeId와 쿼리 storeId 일치 확인
 * - tableNumber 오름차순 정렬 (BR-TABLE-07)
 * - password 필드 제외 (BR-TABLE-02)
 */
export const listTables = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeId } = req.query;
    const user = (req as any).user as JwtPayload;

    // storeId 파라미터 필수 검증
    if (!storeId) {
      res.status(400).json({ message: 'storeId 파라미터가 필요합니다.' });
      return;
    }

    // BR-TABLE-08: JWT storeId와 쿼리 storeId 일치 확인
    if (user.storeId !== storeId) {
      res.status(403).json({ message: '해당 매장에 대한 접근 권한이 없습니다.' });
      return;
    }

    // BR-TABLE-07: tableNumber 오름차순 정렬
    const tables = await TableModel.find({ storeId }).sort({ tableNumber: 1 });

    // BR-TABLE-02: toJSON transform으로 password 자동 제거
    res.status(200).json(tables);
  } catch (error) {
    res.status(500).json({ message: '테이블 목록 조회 중 오류가 발생했습니다.' });
  }
};


/**
 * 테이블 등록 — POST /api/table/create
 * - Body: { storeId, tableNumber, password }
 * - 중복 확인 (BR-TABLE-01)
 * - 비밀번호 bcrypt 해싱 (BR-TABLE-02)
 * - 초기 상태: isActive=false
 */
export const createTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeId, tableNumber, password } = req.body;

    // 필수 필드 검증
    if (!storeId || tableNumber === undefined || tableNumber === null || !password) {
      res.status(400).json({ message: 'storeId, tableNumber, password는 필수 항목입니다.' });
      return;
    }

    // tableNumber 양의 정수 검증
    if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
      res.status(400).json({ message: 'tableNumber는 양의 정수여야 합니다.' });
      return;
    }

    // BR-TABLE-01: 동일 매장 내 테이블 번호 중복 확인
    const existing = await TableModel.findOne({ storeId, tableNumber });
    if (existing) {
      res.status(400).json({ message: '이미 존재하는 테이블 번호입니다.' });
      return;
    }

    // BR-TABLE-02: 비밀번호 bcrypt 해싱 (saltRounds: 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 테이블 생성 (초기 상태: 비활성)
    const table = await TableModel.create({
      storeId,
      tableNumber,
      password: hashedPassword,
      currentSessionId: null,
      sessionStartedAt: null,
      isActive: false,
    });

    // 201 Created + password 제외된 응답 (toJSON transform)
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ message: '테이블 등록 중 오류가 발생했습니다.' });
  }
};

/**
 * 테이블 수정 — PUT /api/table/update/:id
 * - Body: { tableNumber?, password? }
 * - storeId 소유권 확인 (BR-TABLE-08)
 * - tableNumber 변경 시 중복 확인 (BR-TABLE-01)
 * - password 변경 규칙 (BR-TABLE-06)
 */
export const updateTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { tableNumber, password } = req.body;
    const user = (req as any).user as JwtPayload;

    // 테이블 조회
    const table = await TableModel.findById(id);
    if (!table) {
      res.status(404).json({ message: '테이블을 찾을 수 없습니다.' });
      return;
    }

    // BR-TABLE-08: storeId 소유권 확인
    if (table.storeId !== user.storeId) {
      res.status(403).json({ message: '해당 테이블에 대한 접근 권한이 없습니다.' });
      return;
    }

    // 업데이트 데이터 구성
    const updateData: Record<string, unknown> = {};

    // tableNumber 변경 요청 시 중복 확인 (BR-TABLE-01)
    if (tableNumber !== undefined) {
      const duplicate = await TableModel.findOne({
        storeId: table.storeId,
        tableNumber,
        _id: { $ne: id },
      });
      if (duplicate) {
        res.status(400).json({ message: '이미 존재하는 테이블 번호입니다.' });
        return;
      }
      updateData.tableNumber = tableNumber;
    }

    // BR-TABLE-06: password 변경 규칙
    // password가 있고 빈 문자열이 아니면 새로 해싱, 그 외에는 기존 유지
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // 테이블 업데이트
    const updatedTable = await TableModel.findByIdAndUpdate(id, updateData, { new: true });

    // BR-TABLE-02: toJSON transform으로 password 자동 제거
    res.status(200).json(updatedTable);
  } catch (error) {
    res.status(500).json({ message: '테이블 수정 중 오류가 발생했습니다.' });
  }
};

/**
 * 테이블 삭제 — DELETE /api/table/delete/:id
 * - storeId 소유권 확인 (BR-TABLE-08)
 * - 활성 세션 테이블 삭제 방지 (BR-TABLE-04)
 */
export const deleteTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;

    // 테이블 조회
    const table = await TableModel.findById(id);
    if (!table) {
      res.status(404).json({ message: '테이블을 찾을 수 없습니다.' });
      return;
    }

    // BR-TABLE-08: storeId 소유권 확인
    if (table.storeId !== user.storeId) {
      res.status(403).json({ message: '해당 테이블에 대한 접근 권한이 없습니다.' });
      return;
    }

    // BR-TABLE-04: 활성 세션이 있는 테이블 삭제 방지
    if (table.isActive) {
      res.status(400).json({ message: '이용 중인 테이블은 삭제할 수 없습니다. 먼저 세션을 종료해주세요.' });
      return;
    }

    // 테이블 삭제
    await TableModel.findByIdAndDelete(id);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: '테이블 삭제 중 오류가 발생했습니다.' });
  }
};

/**
 * 세션 종료 — POST /api/table/end-session/:id
 * - storeId 소유권 확인 (BR-TABLE-08)
 * - 활성 세션 확인 (BR-TABLE-03)
 * - SessionService.endSession 호출
 */
export const endSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;

    // 테이블 조회
    const table = await TableModel.findById(id);
    if (!table) {
      res.status(404).json({ message: '테이블을 찾을 수 없습니다.' });
      return;
    }

    // BR-TABLE-08: storeId 소유권 확인
    if (table.storeId !== user.storeId) {
      res.status(403).json({ message: '해당 테이블에 대한 접근 권한이 없습니다.' });
      return;
    }

    // BR-TABLE-03: 활성 세션 확인
    if (!table.isActive) {
      res.status(400).json({ message: '활성 세션이 없는 테이블입니다.' });
      return;
    }

    // 세션 종료 처리
    await sessionService.endSession(id);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: '세션 종료 중 오류가 발생했습니다.' });
  }
};
