import api from './api';

const STORAGE_KEYS = {
  storeId: 'yumpick_storeId',
  tableNumber: 'yumpick_tableNumber',
  password: 'yumpick_password',
  token: 'yumpick_token',
  sessionId: 'yumpick_sessionId',
} as const;

// BR-AUTH-07: 자격증명 저장
export function saveCredentials(storeId: string, tableNumber: number, password: string): void {
  localStorage.setItem(STORAGE_KEYS.storeId, storeId);
  localStorage.setItem(STORAGE_KEYS.tableNumber, String(tableNumber));
  localStorage.setItem(STORAGE_KEYS.password, password);
}

export function clearCredentials(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function hasCredentials(): boolean {
  return !!(
    localStorage.getItem(STORAGE_KEYS.storeId) &&
    localStorage.getItem(STORAGE_KEYS.tableNumber) &&
    localStorage.getItem(STORAGE_KEYS.password)
  );
}

// BR-AUTH-07: 자동 로그인
export async function autoLogin(): Promise<{
  token: string;
  sessionId: string;
  storeId: string;
  tableNumber: number;
} | null> {
  const storeId = localStorage.getItem(STORAGE_KEYS.storeId);
  const tableNumber = localStorage.getItem(STORAGE_KEYS.tableNumber);
  const password = localStorage.getItem(STORAGE_KEYS.password);

  if (!storeId || !tableNumber || !password) return null;

  try {
    const res = await api.post('/api/auth/table/login', {
      storeId,
      tableNumber: Number(tableNumber),
      password,
    });
    const { token, sessionId } = res.data;
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.sessionId, sessionId);
    return { token, sessionId, storeId, tableNumber: Number(tableNumber) };
  } catch {
    return null;
  }
}

// 수동 로그인 (초기 설정)
export async function login(
  storeId: string,
  tableNumber: number,
  password: string,
): Promise<{ token: string; sessionId: string }> {
  const res = await api.post('/api/auth/table/login', { storeId, tableNumber, password });
  const { token, sessionId } = res.data;
  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.sessionId, sessionId);
  saveCredentials(storeId, tableNumber, password);
  return { token, sessionId };
}
