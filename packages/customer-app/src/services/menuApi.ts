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

export const fetchMenuList = async (storeId: string): Promise<Menu[]> => {
  const res = await fetch(`${API}/list?storeId=${storeId}`);
  if (!res.ok) throw new Error('메뉴 목록 조회 실패');
  return res.json();
};
