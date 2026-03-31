import { useEffect, useState } from 'react';
import { useAdminStore } from '../stores/adminStore';
import { api } from '../services/api';
import type { Order, OrderDeletedPayload } from '../types';

/**
 * useSSE - SSE 연결 관리 커스텀 훅
 * storeId별 SSE 연결을 수립하고 이벤트를 수신하여 스토어를 업데이트
 */
export function useSSE(storeId: string | null): {
  isConnected: boolean;
  error: string | null;
} {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOrder = useAdminStore((s) => s.addOrder);
  const updateOrder = useAdminStore((s) => s.updateOrder);
  const removeOrder = useAdminStore((s) => s.removeOrder);
  const setNewOrderFlag = useAdminStore((s) => s.setNewOrderFlag);

  useEffect(() => {
    if (!storeId) return;

    const token = api.getToken();
    if (!token) return;

    // EventSource는 Authorization 헤더 미지원 → token을 query param으로 전달
    const url = `/api/sse/orders?storeId=${storeId}&token=${token}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    // new_order 이벤트
    eventSource.addEventListener('new_order', (e: MessageEvent) => {
      const order: Order = JSON.parse(e.data);
      addOrder(order);
      setNewOrderFlag(order.tableId, true);
    });

    // order_status_updated 이벤트
    eventSource.addEventListener('order_status_updated', (e: MessageEvent) => {
      const order: Order = JSON.parse(e.data);
      updateOrder(order);
    });

    // order_deleted 이벤트
    eventSource.addEventListener('order_deleted', (e: MessageEvent) => {
      const { orderId }: OrderDeletedPayload = JSON.parse(e.data);
      removeOrder(orderId);
    });

    // 연결 오류
    eventSource.onerror = () => {
      setIsConnected(false);
      setError('실시간 연결이 끊겼습니다. 재연결 중...');
      // EventSource는 자동 재연결 시도
    };

    // 클린업
    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [storeId, addOrder, updateOrder, removeOrder, setNewOrderFlag]);

  return { isConnected, error };
}
