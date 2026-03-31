/**
 * TableManagementPage 단위 테스트
 * - 마운트 시 fetchTables 호출
 * - 테이블 카드 렌더링
 * - "테이블 추가" 버튼 → TableForm 모달 열기
 * - 삭제 확인 다이얼로그
 * - 세션 종료 확인 다이얼로그
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TableManagementPage from '../../pages/TableManagementPage';
import { useAdminTableStore } from '../../stores/adminTableStore';
import type { ITable } from '../../../../shared/src/types';

// --- 스토어 mock ---
jest.mock('../../stores/adminTableStore');
const mockedStore = useAdminTableStore as unknown as jest.Mock;

// --- 하위 컴포넌트 mock ---
jest.mock('../../components/TableCard', () => {
  return function MockTableCard(props: any) {
    return (
      <div data-testid={`table-card-${props.table.tableNumber}`}>
        <span>테이블 {props.table.tableNumber}</span>
        <button data-testid={`delete-${props.table._id}`} onClick={() => props.onDelete(props.table._id)}>삭제</button>
        <button data-testid={`end-${props.table._id}`} onClick={() => props.onEndSession(props.table._id)}>이용 완료</button>
      </div>
    );
  };
});

jest.mock('../../components/TableForm', () => {
  return function MockTableForm(props: any) {
    return <div data-testid="table-form">TableForm Mock</div>;
  };
});

jest.mock('../../components/OrderHistoryModal', () => {
  return function MockOrderHistoryModal() {
    return <div data-testid="order-history-modal">OrderHistoryModal Mock</div>;
  };
});

// --- 헬퍼 ---
const makeTable = (overrides: Partial<ITable> = {}): ITable => ({
  _id: 'table-1',
  storeId: 'store-1',
  tableNumber: 1,
  currentSessionId: null,
  sessionStartedAt: null,
  isActive: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const defaultStoreState = {
  tables: [] as ITable[],
  isLoading: false,
  error: null,
  fetchTables: jest.fn(),
  createTable: jest.fn(),
  updateTable: jest.fn(),
  deleteTable: jest.fn(),
  endTableSession: jest.fn(),
};

const setupStore = (overrides: Partial<typeof defaultStoreState> = {}) => {
  const state = { ...defaultStoreState, ...overrides };
  mockedStore.mockReturnValue(state);
  return state;
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================
describe('TableManagementPage', () => {
  it('마운트 시 fetchTables를 호출한다', () => {
    const store = setupStore();
    render(<TableManagementPage />);
    expect(store.fetchTables).toHaveBeenCalledTimes(1);
  });

  it('각 테이블에 대해 TableCard를 렌더링한다', () => {
    setupStore({
      tables: [
        makeTable({ _id: 't1', tableNumber: 1 }),
        makeTable({ _id: 't2', tableNumber: 2 }),
      ],
    });
    render(<TableManagementPage />);

    expect(screen.getByTestId('table-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('table-card-2')).toBeInTheDocument();
  });

  it('"테이블 추가" 버튼 클릭 시 TableForm 모달이 열린다', () => {
    setupStore();
    render(<TableManagementPage />);

    // 모달이 아직 없음
    expect(screen.queryByTestId('table-form')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('add-table-button'));

    expect(screen.getByTestId('table-form')).toBeInTheDocument();
  });

  it('삭제 확인 다이얼로그에서 확인 시 deleteTable을 호출한다', () => {
    const store = setupStore({
      tables: [makeTable({ _id: 't1', tableNumber: 1 })],
    });
    window.confirm = jest.fn(() => true);

    render(<TableManagementPage />);
    fireEvent.click(screen.getByTestId('delete-t1'));

    expect(window.confirm).toHaveBeenCalledWith('테이블을 삭제하시겠습니까?');
    expect(store.deleteTable).toHaveBeenCalledWith('t1');
  });

  it('삭제 확인 다이얼로그에서 취소 시 deleteTable을 호출하지 않는다', () => {
    const store = setupStore({
      tables: [makeTable({ _id: 't1', tableNumber: 1 })],
    });
    window.confirm = jest.fn(() => false);

    render(<TableManagementPage />);
    fireEvent.click(screen.getByTestId('delete-t1'));

    expect(store.deleteTable).not.toHaveBeenCalled();
  });

  it('세션 종료 확인 다이얼로그에서 확인 시 endTableSession을 호출한다', () => {
    const store = setupStore({
      tables: [makeTable({ _id: 't1', tableNumber: 1, isActive: true })],
    });
    window.confirm = jest.fn(() => true);

    render(<TableManagementPage />);
    fireEvent.click(screen.getByTestId('end-t1'));

    expect(window.confirm).toHaveBeenCalled();
    expect(store.endTableSession).toHaveBeenCalledWith('t1');
  });

  it('세션 종료 확인 다이얼로그에서 취소 시 endTableSession을 호출하지 않는다', () => {
    const store = setupStore({
      tables: [makeTable({ _id: 't1', tableNumber: 1, isActive: true })],
    });
    window.confirm = jest.fn(() => false);

    render(<TableManagementPage />);
    fireEvent.click(screen.getByTestId('end-t1'));

    expect(store.endTableSession).not.toHaveBeenCalled();
  });
});
