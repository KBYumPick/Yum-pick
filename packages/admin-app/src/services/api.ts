import axios from 'axios';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3000';

const axiosInstance = axios.create({ baseURL: API_BASE });

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('yumpick_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 응답 시 자동 로그아웃
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('yumpick_admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;

// Legacy fetch-based API (for backward compatibility)
function getToken(): string | null {
  return localStorage.getItem('yumpick_admin_token');
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

  fetchOrders(storeId: string) {
    return request<any[]>(`/api/order/list?storeId=${storeId}`);
  },

  fetchTables(storeId: string) {
    return request<any[]>(`/api/table/list?storeId=${storeId}`);
  },

  updateOrderStatus(orderId: string, status: string) {
    return request<any>(`/api/order/status/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  deleteOrder(orderId: string) {
    return request<{ success: boolean }>(`/api/order/delete/${orderId}`, {
      method: 'DELETE',
    });
  },
};
