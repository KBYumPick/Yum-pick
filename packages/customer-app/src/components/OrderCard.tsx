import type { Order } from '../types/order';

interface OrderCardProps {
  order: Order;
}

const STATUS_BADGE: Record<string, { text: string; bg: string; color: string }> = {
  pending: { text: '대기중', bg: '#fef3c7', color: '#92400e' },
  preparing: { text: '준비중', bg: '#dbeafe', color: '#1e40af' },
  completed: { text: '완료', bg: '#d1fae5', color: '#065f46' },
};

/** 개별 주문 카드 (US-08) */
export function OrderCard({ order }: OrderCardProps) {
  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending;
  const createdAt = new Date(order.createdAt);
  const timeStr = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}`;

  return (
    <div
      data-testid={`order-card-${order._id}`}
      style={{
        border: '1px solid #e5e7eb', borderRadius: 12, padding: 16,
        marginBottom: 12, backgroundColor: '#fff',
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <span data-testid={`order-number-${order._id}`} style={{ fontWeight: 700 }}>
            {order.orderNumber}
          </span>
        </div>
        <span
          data-testid={`order-status-${order._id}`}
          style={{
            padding: '4px 10px', borderRadius: 12, fontSize: 12,
            fontWeight: 600, backgroundColor: badge.bg, color: badge.color,
          }}
        >
          {badge.text}
        </span>
      </div>

      <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>{timeStr}</div>

      {/* 항목 */}
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
        {order.items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
            <span>{item.menuName} × {item.quantity}</span>
            <span>{(item.unitPrice * item.quantity).toLocaleString()}원</span>
          </div>
        ))}
      </div>

      {/* 합계 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 8,
        fontWeight: 700,
      }}>
        <span>합계</span>
        <span>{order.totalAmount.toLocaleString()}원</span>
      </div>
    </div>
  );
}
