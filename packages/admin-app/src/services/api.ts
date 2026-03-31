const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

function getStoreId(): string | null {
  return localStorage.getItem('admin_storeId');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '요청 실패' }));
    throw new Error(error.message || '요청 실패');
  }

  return res.json();
}

export const api = {
  getToken,
  getStoreId,

  // 주문 목록 조회
  fetchOrders(storeId: string) {
    return request<import('../types').Order[]>(`/order/list?storeId=${storeId}`);
  },

  // 테이블 목록 조회
  fetchTables(storeId: string) {
    return request<import('../types').Table[]>(`/table/list?storeId=${storeId}`);
  },

  // 주문 상태 변경
  updateOrderStatus(orderId: string, status: string) {
    return request<import('../types').Order>(`/order/status/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // 주문 삭제
  deleteOrder(orderId: string) {
    return request<{ success: boolean }>(`/order/delete/${orderId}`, {
      method: 'DELETE',
    });
  },
};
