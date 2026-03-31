import type { DashboardView } from '../types';
import './TableOrderCard.css';

interface TableOrderCardProps {
  view: DashboardView;
  onClick: (view: DashboardView) => void;
}

export function TableOrderCard({ view, onClick }: TableOrderCardProps) {
  const { tableNumber, totalAmount, latestOrder, hasNewOrder, pendingCount, preparingCount } = view;

  // 최신 주문 미리보기 텍스트
  const previewText = latestOrder
    ? latestOrder.items.length <= 2
      ? latestOrder.items.map((i) => i.menuName).join(', ')
      : `${latestOrder.items[0].menuName} 외 ${latestOrder.items.length - 1}개`
    : '주문 없음';

  return (
    <div
      className={`card ${hasNewOrder ? 'card--new-order' : ''}`}
      onClick={() => onClick(view)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick(view);
      }}
      aria-label={`테이블 ${tableNumber} 주문 현황`}
    >
      <div className="card__header">
        <span className="card__table-number">테이블 {tableNumber}</span>
        <span className="card__total">{totalAmount.toLocaleString()}원</span>
      </div>

      <p className="card__preview">{previewText}</p>

      <div className="card__badges">
        {pendingCount > 0 && (
          <span className="badge badge--pending">대기 {pendingCount}</span>
        )}
        {preparingCount > 0 && (
          <span className="badge badge--preparing">준비중 {preparingCount}</span>
        )}
      </div>
    </div>
  );
}
