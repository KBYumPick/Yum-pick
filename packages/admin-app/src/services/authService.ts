import api from './api';

const TOKEN_KEY = 'yumpick_admin_token';

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// JWT payload에서 만료 시각 확인
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// 앱 초기화 시 세션 복원
export function restoreSession(): { token: string; storeId: string } | null {
  const token = getToken();
  if (!token || isTokenExpired()) {
    clearToken();
    return null;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { token, storeId: payload.storeId };
  } catch {
    clearToken();
    return null;
  }
}

// 관리자 로그인
export async function login(
  storeId: string,
  username: string,
  password: string,
): Promise<{ token: string; storeId: string }> {
  const res = await api.post('/api/auth/admin/login', { storeId, username, password });
  const { token } = res.data;
  saveToken(token);
  return { token, storeId };
}

export function logout(): void {
  clearToken();
}
