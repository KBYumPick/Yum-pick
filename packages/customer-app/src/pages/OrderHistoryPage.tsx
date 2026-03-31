import { useEffect, useState } from 'react';
import { useCustomerStore } from '../stores/customerStore';
import { OrderCard } from '../components/OrderCard';

/** 주문 내역 페이지 (US-08) */
export function OrderHistoryPage() {
  const orders = useCustomerStore((s) => s.orders);
  const fetchOrders = useCustomerStore((s) => s.fetchOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchOrders();
    } catch {
      setError('주문 내역을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-testid="order-history-page" style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>주문 내역</h1>
        <button
          data-testid="order-refresh-button"
          onClick={loadOrders}
          disabled={isLoading}
          aria-label="주문 내역 새로고침"
          style={{
            padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 8,
            backgroundColor: '#fff', fontSize: 14, cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? '로딩 중...' : '새로고침'}
        </button>
      </div>

      {/* 에러 */}
      {error && (
        <p data-testid="order-history-error" style={{ color: '#ef4444', marginBottom: 12 }}>
          {error}
        </p>
      )}

      {/* 주문 목록 */}
      {orders.length === 0 && !isLoading ? (
        <p data-testid="order-history-empty" style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
          아직 주문 내역이 없습니다.
        </p>
      ) : (
        orders.map((order) => <OrderCard key={order._id} order={order} />)
      )}
    </div>
  );
}
