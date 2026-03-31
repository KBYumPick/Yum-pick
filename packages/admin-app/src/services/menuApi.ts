export interface Menu {
  _id: string;
  storeId: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  imageUrl?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const API = '/api/menu';

const authHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

export const fetchMenuList = async (storeId: string): Promise<Menu[]> => {
  const res = await fetch(`${API}/list?storeId=${storeId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('메뉴 목록 조회 실패');
  return res.json();
};

export const createMenu = async (data: { name: string; price: number; description?: string; category: string; imageUrl?: string }): Promise<Menu> => {
  const res = await fetch(`${API}/create`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || '메뉴 등록 실패'); }
  return res.json();
};

export const updateMenu = async (id: string, data: Partial<Pick<Menu, 'name' | 'price' | 'description' | 'category' | 'imageUrl'>>): Promise<Menu> => {
  const res = await fetch(`${API}/update/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || '메뉴 수정 실패'); }
  return res.json();
};

export const deleteMenu = async (id: string): Promise<void> => {
  const res = await fetch(`${API}/delete/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error('메뉴 삭제 실패');
};

export const reorderMenus = async (menuIds: string[]): Promise<void> => {
  const res = await fetch(`${API}/reorder`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ menuIds }) });
  if (!res.ok) throw new Error('메뉴 순서 변경 실패');
};
