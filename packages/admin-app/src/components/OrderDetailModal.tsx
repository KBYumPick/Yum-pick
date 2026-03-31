import { useState } from 'react';
import type { DashboardView, Order } from '../types';
import { NEXT_STATUS_LABEL, VALID_TRANSITIONS } from '../types';
import { useAdminStore } from '../stores/adminStore';
import './OrderDetailModal.css';

interface OrderDetailModalProps {
  view: DashboardView;
  onClose: () => void;
}

export function OrderDetailModal({ view, onClose }: OrderDetailModalProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const updateOrderStatus = useAdminStore((s) => s.updateOrderStatus);
  const deleteOrder = useAdminStore((s) => s.deleteOrder);

  // 주문 목록: createdAt 오름차순
  const sortedOrders = [...view.orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const handleStatusChange = async (order: Order) => {
    const nextStatus = VALID_TRANSITIONS[order.status];
    if (nextStatus) {
      await updateOrderStatus(order._id, nextStatus);
    }
  };

  const handleDelete = async (orderId: string) => {
    await deleteOrder(orderId);
    setConfirmDeleteId(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>테이블 {view.tableNumber}</h2>
          <span className="modal__total">총 {view.totalAmount.toLocaleString()}원</span>
          <button className="modal__close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="modal__body">
          {sortedOrders.length === 0 && <p className="modal__empty">주문이 없습니다.</p>}

          {sortedOrders.map((order) => (
            <div key={order._id} className="order-item">
              <div className="order-item__header">
                <span className="order-item__number">#{order.orderNumber}</span>
                <span className="order-item__time">
                  {new Date(order.createdAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className={`status-badge status-badge--${order.status}`}>
                  {order.status === 'pending' && '대기중'}
                  {order.status === 'preparing' && '준비중'}
                  {order.status === 'completed' && '완료'}
                </span>
              </div>

              <ul className="order-item__menus">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.menuName} × {item.quantity} - {item.unitPrice.toLocaleString()}원
                  </li>
                ))}
              </ul>

              <div className="order-item__footer">
                <span className="order-item__amount">
                  {order.totalAmount.toLocaleString()}원
                </span>

                <div className="order-item__actions">
                  {NEXT_STATUS_LABEL[order.status] && (
                    <button
                      className="btn btn--status"
                      onClick={() => handleStatusChange(order)}
                    >
                      {NEXT_STATUS_LABEL[order.status]}
                    </button>
                  )}

                  <button
                    className="btn btn--delete"
                    onClick={() => setConfirmDeleteId(order._id)}
                  >
                    삭제
                  </button>
                </div>
              </div>

              {/* 삭제 확인 팝업 */}
              {confirmDeleteId === order._id && (
                <div className="confirm-popup">
                  <p>이 주문을 삭제하시겠습니까?</p>
                  <p className="confirm-popup__sub">삭제된 주문은 복구할 수 없습니다.</p>
                  <div className="confirm-popup__actions">
                    <button
                      className="btn btn--cancel"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      취소
                    </button>
                    <button
                      className="btn btn--confirm-delete"
                      onClick={() => handleDelete(order._id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
