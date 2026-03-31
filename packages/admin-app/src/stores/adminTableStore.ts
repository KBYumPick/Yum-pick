import { create } from 'zustand';

// TODO: @yumpick/shared 패키지 설정 후 import 경로 변경
import type {
  ITable,
  ITableFormData,
  IUpdateTableRequest,
} from '../../../shared/src/types';

// API 기본 URL (환경변수 또는 기본값)
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// TODO: Unit 1 (채원) AdminAuthService에서 storeId, token을 가져오는 로직으로 교체
// 현재는 stub으로 localStorage에서 직접 읽음
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('adminToken') || '';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};
const getStoreId = (): string => localStorage.getItem('storeId') || '';

/** 테이블 관리 스토어 상태 인터페이스 */
interface AdminTableState {
  tables: ITable[];
  isLoading: boolean;
  error: string | null;

  // 액션
  /** 테이블 목록 조회 (BR-TABLE-07: tableNumber 오름차순) */
  fetchTables: () => Promise<void>;
  /** 테이블 생성 (BR-TABLE-01: 중복 방지는 서버에서 처리) */
  createTable: (data: ITableFormData) => Promise<void>;
  /** 테이블 수정 (BR-TABLE-06: 비밀번호 선택적 변경) */
  updateTable: (id: string, data: IUpdateTableRequest) => Promise<void>;
  /** 테이블 삭제 (BR-TABLE-04: 활성 세션 삭제 방지는 서버에서 처리) */
  deleteTable: (id: string) => Promise<void>;
  /** 테이블 세션 종료 (BR-TABLE-03: 세션 종료 규칙) */
  endTableSession: (tableId: string) => Promise<void>;
}

/** 테이블 관리 Zustand 스토어 */
export const useAdminTableStore = create<AdminTableState>((set, get) => ({
  tables: [],
  isLoading: false,
  error: null,

  // 테이블 목록 조회 — GET /api/table/list?storeId={storeId}
  // BR-TABLE-07: 서버에서 tableNumber 오름차순 정렬하여 반환
  fetchTables: async () => {
    set({ isLoading: true, error: null });
    try {
      const storeId = getStoreId();
      const res = await fetch(
        `${API_BASE}/table/list?storeId=${encodeURIComponent(storeId)}`,
        { headers: getAuthHeaders() },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || '테이블 목록을 불러오지 못했습니다.');
      }
      const tables: ITable[] = await res.json();
      set({ tables, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '테이블 목록을 불러오지 못했습니다.';
      set({ error: message, isLoading: false });
    }
  },

  // 테이블 생성 — POST /api/table/create
  // BR-TABLE-07: 생성 후 tableNumber 오름차순 재정렬
  createTable: async (data: ITableFormData) => {
    set({ isLoading: true, error: null });
    try {
      const storeId = getStoreId();
      const res = await fetch(`${API_BASE}/table/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...data, storeId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || '테이블 생성에 실패했습니다.');
      }
      const created: ITable = await res.json();
      const updated = [...get().tables, created].sort(
        (a, b) => a.tableNumber - b.tableNumber,
      );
      set({ tables: updated, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '테이블 생성에 실패했습니다.';
      set({ error: message, isLoading: false });
      throw err; // 폼에서 에러를 잡을 수 있도록 re-throw
    }
  },

  // 테이블 수정 — PUT /api/table/update/{id}
  // BR-TABLE-06: password가 빈 문자열이면 서버에서 기존 비밀번호 유지
  updateTable: async (id: string, data: IUpdateTableRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/table/update/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || '테이블 수정에 실패했습니다.');
      }
      const updated: ITable = await res.json();
      set({
        tables: get().tables.map((t) => (t._id === id ? updated : t)),
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '테이블 수정에 실패했습니다.';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  // 테이블 삭제 — DELETE /api/table/delete/{id}
  // BR-TABLE-04: 활성 세션 테이블 삭제 방지는 서버에서 처리
  deleteTable: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/table/delete/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || '테이블 삭제에 실패했습니다.');
      }
      set({
        tables: get().tables.filter((t) => t._id !== id),
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '테이블 삭제에 실패했습니다.';
      set({ error: message, isLoading: false });
    }
  },

  // 테이블 세션 종료 — POST /api/table/end-session/{tableId}
  // BR-TABLE-03: isActive=false, currentSessionId=null, sessionStartedAt=null
  endTableSession: async (tableId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/table/end-session/${tableId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || '세션 종료에 실패했습니다.');
      }
      // 로컬 상태 업데이트
      set({
        tables: get().tables.map((t) =>
          t._id === tableId
            ? {
                ...t,
                isActive: false,
                currentSessionId: null,
                sessionStartedAt: null,
              }
            : t,
        ),
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '세션 종료에 실패했습니다.';
      set({ error: message, isLoading: false });
    }
  },
}));
