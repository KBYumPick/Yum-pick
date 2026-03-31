/**
 * TableCard 단위 테스트
 * - isActive=true: "이용 중" 배지, 세션 시간 표시, "이용 완료" 활성, "삭제" 비활성
 * - isActive=false: "비어 있음" 배지, 세션 시간 미표시, "이용 완료" 비활성, "삭제" 활성
 * - 버튼 클릭 시 올바른 콜백 호출
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TableCard from '../../components/TableCard';
import type { ITable } from '../../../../shared/src/types';

// --- 헬퍼 ---
const makeTable = (overrides: Partial<ITable> = {}): ITable => ({
  _id: 'table-1',
  storeId: 'store-1',
  tableNumber: 3,
  currentSessionId: null,
  sessionStartedAt: null,
  isActive: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const defaultCallbacks = {
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onEndSession: jest.fn(),
  onViewHistory: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ============================================================
describe('TableCard — 활성 테이블 (isActive=true)', () => {
  const activeTable = makeTable({
    isActive: true,
    currentSessionId: 'sess-1',
    sessionStartedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30분 전
  });

  it('"이용 중" 배지를 표시한다', () => {
    render(<TableCard table={activeTable} {...defaultCallbacks} />);
    expect(screen.getByTestId('table-status-badge')).toHaveTextContent('이용 중');
  });

  it('세션 시간을 표시한다', () => {
    render(<TableCard table={activeTable} {...defaultCallbacks} />);
    expect(screen.getByTestId('table-session-time')).toBeInTheDocument();
  });

  it('"이용 완료" 버튼이 활성화되어 있다', () => {
    render(<TableCard table={activeTable} {...defaultCallbacks} />);
    expect(screen.getByTestId('table-end-session-button')).not.toBeDisabled();
  });

  it('"삭제" 버튼이 비활성화되어 있다 (BR-TABLE-04)', () => {
    render(<TableCard table={activeTable} {...defaultCallbacks} />);
    expect(screen.getByTestId('table-delete-button')).toBeDisabled();
  });
});

// ============================================================
describe('TableCard — 비활성 테이블 (isActive=false)', () => {
  const inactiveTable = makeTable({ isActive: false });

  it('"비어 있음" 배지를 표시한다', () => {
    render(<TableCard table={inactiveTable} {...defaultCallbacks} />);
    expect(screen.getByTestId('table-status-badge')).toHaveTextContent('비어 있음');
  });

  it('세션 시간을 표시하지 않는다', () => {
    render(<TableCard table={inactiveTable} {...defaultCallbacks} />);
    expect(screen.queryByTestId('table-session-time')).not.toBeInTheDocument();
  });

  it('"이용 완료" 버튼이 비활성화되어 있다', () => {
    render(<TableCard table={inactiveTable} {...defaultCallbacks} />);
    expect(screen.getByTestId('table-end-session-button')).toBeDisabled();
  });

  it('"삭제" 버튼이 활성화되어 있다', () => {
    render(<TableCard table={inactiveTable} {...defaultCallbacks} />);
    expect(screen.getByTestId('table-delete-button')).not.toBeDisabled();
  });
});

// ============================================================
describe('TableCard — 버튼 콜백', () => {
  const table = makeTable({ _id: 'tbl-99', isActive: false });

  it('수정 버튼 클릭 시 onEdit(table)을 호출한다', () => {
    render(<TableCard table={table} {...defaultCallbacks} />);
    fireEvent.click(screen.getByTestId('table-edit-button'));
    expect(defaultCallbacks.onEdit).toHaveBeenCalledWith(table);
  });

  it('삭제 버튼 클릭 시 onDelete(tableId)를 호출한다', () => {
    render(<TableCard table={table} {...defaultCallbacks} />);
    fireEvent.click(screen.getByTestId('table-delete-button'));
    expect(defaultCallbacks.onDelete).toHaveBeenCalledWith('tbl-99');
  });

  it('이용 완료 버튼 클릭 시 onEndSession(tableId)을 호출한다', () => {
    const active = makeTable({ _id: 'tbl-99', isActive: true, sessionStartedAt: new Date().toISOString() });
    render(<TableCard table={active} {...defaultCallbacks} />);
    fireEvent.click(screen.getByTestId('table-end-session-button'));
    expect(defaultCallbacks.onEndSession).toHaveBeenCalledWith('tbl-99');
  });

  it('주문 내역 버튼 클릭 시 onViewHistory(tableId)를 호출한다', () => {
    render(<TableCard table={table} {...defaultCallbacks} />);
    fireEvent.click(screen.getByTestId('table-view-history-button'));
    expect(defaultCallbacks.onViewHistory).toHaveBeenCalledWith('tbl-99');
  });
});
