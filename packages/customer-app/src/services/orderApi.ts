import axios from 'axios';
import type { Order, CreateOrderPayload } from '../types/order';

const api = axios.create({
  baseURL: '/api/order',
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터: JWT 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('yumpick_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const orderApi = {
  /** 주문 생성 (US-07) */
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await api.post<Order>('/create', payload);
    return data;
  },

  /** 주문 목록 조회 (US-08) */
  async listOrders(
    storeId: string,
    tableId: string,
    sessionId: string,
    status?: string
  ): Promise<Order[]> {
    const params: Record<string, string> = { storeId, tableId, sessionId };
    if (status) params.status = status;
    const { data } = await api.get<Order[]>('/list', { params });
    return data;
  },

  /** 주문 상세 조회 (US-08) */
  async getOrder(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/detail/${id}`);
    return data;
  },
};
