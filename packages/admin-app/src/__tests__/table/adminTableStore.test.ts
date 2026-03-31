/**
 * adminTableStore 단위 테스트
 * - fetchTables, createTable, updateTable, deleteTable, endTableSession 액션 검증
 * - API 호출 및 상태 업데이트 검증
 * - 에러 핸들링 검증
 */
import { act } from '@testing-library/react';
import { useAdminTableStore } from '../../stores/adminTableStore';
import type { ITable } from '../../../../shared/src/types';

// --- fetch mock 설정 ---
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// localStorage stub
beforeAll(() => {
  Storage.prototype.getItem = jest.fn((key: string) => {
    if (key === 'adminToken') return 'test-token';
    if (key === 'storeId') return 'store-1';
    return null;
  });
});

// 스토어 초기화
beforeEach(() => {
  mockFetch.mockReset();
  act(() => {
    useAdminTableStore.setState({ tables: [], isLoading: false, error: null });
  });
});

// --- 테스트 헬퍼 ---
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

const okJson = (data: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);

const failJson = (message: string, status = 400) =>
  Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
  } as unknown as Response);

// ============================================================
// fetchTables
// ============================================================
describe('fetchTables', () => {
  it('API 호출 후 tables 상태를 설정한다', async () => {
    const tables = [makeTable({ _id: 't1', tableNumber: 1 }), makeTable({ _id: 't2', tableNumber: 2 })];
    mockFetch.mockReturnValueOnce(okJson(tables));

    await act(async () => {
      await useAdminTableStore.getState().fetchTables();
    });

    const state = useAdminTableStore.getState();
    expect(state.tables).toHaveLength(2);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/table/list?storeId=store-1'),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('API 실패 시 error 상태를 설정한다', async () => {
    mockFetch.mockReturnValueOnce(failJson('서버 오류'));

    await act(async () => {
      await useAdminTableStore.getState().fetchTables();
    });

    const state = useAdminTableStore.getState();
    expect(state.error).toBe('서버 오류');
    expect(state.isLoading).toBe(false);
  });
});

// ============================================================
// createTable
// ============================================================
describe('createTable', () => {
  it('API 호출 후 테이블을 추가하고 tableNumber 오름차순 정렬한다', async () => {
    // 기존 테이블 2번이 있는 상태
    act(() => {
      useAdminTableStore.setState({ tables: [makeTable({ _id: 't2', tableNumber: 2 })] });
    });

    const created = makeTable({ _id: 't1', tableNumber: 1 });
    mockFetch.mockReturnValueOnce(okJson(created));

    await act(async () => {
      await useAdminTableStore.getState().createTable({ tableNumber: 1, password: '1234' });
    });

    const state = useAdminTableStore.getState();
    expect(state.tables).toHaveLength(2);
    // tableNumber 오름차순 정렬 확인
    expect(state.tables[0].tableNumber).toBe(1);
    expect(state.tables[1].tableNumber).toBe(2);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/table/create'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('API 실패 시 error 설정 후 에러를 re-throw 한다', async () => {
    mockFetch.mockReturnValueOnce(failJson('중복된 테이블 번호'));

    await expect(
      act(async () => {
        await useAdminTableStore.getState().createTable({ tableNumber: 1, password: '1234' });
      }),
    ).rejects.toThrow();

    expect(useAdminTableStore.getState().error).toBe('중복된 테이블 번호');
  });
});

// ============================================================
// updateTable
// ============================================================
describe('updateTable', () => {
  it('API 호출 후 해당 테이블을 교체한다', async () => {
    const original = makeTable({ _id: 't1', tableNumber: 1 });
    act(() => {
      useAdminTableStore.setState({ tables: [original] });
    });

    const updated = { ...original, tableNumber: 5 };
    mockFetch.mockReturnValueOnce(okJson(updated));

    await act(async () => {
      await useAdminTableStore.getState().updateTable('t1', { tableNumber: 5 });
    });

    expect(useAdminTableStore.getState().tables[0].tableNumber).toBe(5);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/table/update/t1'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('API 실패 시 error 설정 후 에러를 re-throw 한다', async () => {
    act(() => {
      useAdminTableStore.setState({ tables: [makeTable()] });
    });
    mockFetch.mockReturnValueOnce(failJson('수정 실패'));

    await expect(
      act(async () => {
        await useAdminTableStore.getState().updateTable('table-1', { tableNumber: 99 });
      }),
    ).rejects.toThrow();

    expect(useAdminTableStore.getState().error).toBe('수정 실패');
  });
});

// ============================================================
// deleteTable
// ============================================================
describe('deleteTable', () => {
  it('API 호출 후 해당 테이블을 제거한다', async () => {
    act(() => {
      useAdminTableStore.setState({
        tables: [makeTable({ _id: 't1' }), makeTable({ _id: 't2', tableNumber: 2 })],
      });
    });
    mockFetch.mockReturnValueOnce(okJson({}));

    await act(async () => {
      await useAdminTableStore.getState().deleteTable('t1');
    });

    const state = useAdminTableStore.getState();
    expect(state.tables).toHaveLength(1);
    expect(state.tables[0]._id).toBe('t2');
  });

  it('API 실패 시 error 상태를 설정한다', async () => {
    act(() => {
      useAdminTableStore.setState({ tables: [makeTable()] });
    });
    mockFetch.mockReturnValueOnce(failJson('활성 세션 삭제 불가'));

    await act(async () => {
      await useAdminTableStore.getState().deleteTable('table-1');
    });

    expect(useAdminTableStore.getState().error).toBe('활성 세션 삭제 불가');
  });
});

// ============================================================
// endTableSession
// ============================================================
describe('endTableSession', () => {
  it('API 호출 후 로컬 상태를 비활성으로 업데이트한다', async () => {
    const active = makeTable({
      _id: 't1',
      isActive: true,
      currentSessionId: 'sess-1',
      sessionStartedAt: '2024-06-01T10:00:00Z',
    });
    act(() => {
      useAdminTableStore.setState({ tables: [active] });
    });
    mockFetch.mockReturnValueOnce(okJson({}));

    await act(async () => {
      await useAdminTableStore.getState().endTableSession('t1');
    });

    const t = useAdminTableStore.getState().tables[0];
    expect(t.isActive).toBe(false);
    expect(t.currentSessionId).toBeNull();
    expect(t.sessionStartedAt).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/table/end-session/t1'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('API 실패 시 error 상태를 설정한다', async () => {
    act(() => {
      useAdminTableStore.setState({
        tables: [makeTable({ _id: 't1', isActive: true })],
      });
    });
    mockFetch.mockReturnValueOnce(failJson('세션 종료 실패'));

    await act(async () => {
      await useAdminTableStore.getState().endTableSession('t1');
    });

    expect(useAdminTableStore.getState().error).toBe('세션 종료 실패');
  });
});
