import React, { useState, useEffect, useCallback } from 'react';

// TODO: @yumpick/shared 패키지 설정 후 import 경로 변경
import type { IOrderHistory } from '../../../shared/src/types';

// API 기본 URL (환경변수 또는 기본값)
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// TODO: Unit 1 (채원) AdminAuthService에서 storeId, token을 가져오는 로직으로 교체
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('adminToken') || '';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};
const getStoreId = (): string => localStorage.getItem('storeId') || '';

interface OrderHistoryModalProps {
  tableId: string;
  tableNumber: number;
  onClose: () => void;
}

/** 시각 포맷 헬퍼 (HH:MM) */
function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** 금액 포맷 헬퍼 (천 단위 콤마) */
function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

/** 주문 상태 한글 매핑 */
function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return '대기중';
    case 'preparing':
      return '준비중';
    case 'completed':
      return '완료';
    default:
      return status;
  }
}

/** 과거 주문 내역 모달 컴포넌트 */
const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  tableId,
  tableNumber,
  onClose,
}) => {
  const [orders, setOrders] = useState<IOrderHistory[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 과거 주문 내역 조회 — GET /api/order/history */
  const fetchHistory = useCallback(
    async (date: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const storeId = getStoreId();
        const params = new URLSearchParams({ storeId, tableId });
        if (date) {
          params.set('date', date);
        }
        const res = await fetch(`${API_BASE}/order/history?${params.toString()}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || '주문 내역을 불러오지 못했습니다.');
        }
        const data: IOrderHistory[] = await res.json();
        setOrders(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : '주문 내역을 불러오지 못했습니다.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [tableId],
  );

  // 마운트 시 전체 과거 주문 로드
  useEffect(() => {
    fetchHistory('');
  }, [fetchHistory]);

  // 날짜 변경 시 재조회
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    fetchHistory(date);
  };

  // "전체 보기" 버튼 — 날짜 필터 초기화
  const handleShowAll = () => {
    setSelectedDate('');
    fetchHistory('');
  };

  /** 빈 상태 메시지 결정 */
  const emptyMessage = selectedDate
    ? '해당 날짜의 주문 내역이 없습니다.'
    : '과거 주문 내역이 없습니다.';

  return (
    <div data-testid="order-history-modal" style={styles.overlay}>
      <div style={styles.modal}>
        {/* 헤더 */}
        <div style={styles.header}>
          <h2 data-testid="order-history-title" style={styles.title}>
            테이블 {tableNumber} - 과거 주문 내역
          </h2>
          <button
            data-testid="order-history-close-button"
            style={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 날짜 필터 */}
        <div style={styles.filterRow}>
          <input
            data-testid="order-history-date-filter"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            style={styles.dateInput}
          />
          <button
            data-testid="order-history-show-all-button"
            style={styles.showAllButton}
            onClick={handleShowAll}
          >
            전체 보기
          </button>
        </div>

        {/* 콘텐츠 영역 */}
        <div style={styles.content}>
          {/* 로딩 스피너 */}
          {isLoading && (
            <div data-testid="order-history-loading" style={styles.loading}>
              불러오는 중...
            </div>
          )}

          {/* 에러 메시지 */}
          {error && <p style={styles.error}>{error}</p>}

          {/* 주문 목록 */}
          {!isLoading && !error && orders.length > 0 && (
            <div data-testid="order-history-list">
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>주문번호</th>
                    <th style={styles.th}>시각</th>
                    <th style={styles.th}>메뉴</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>금액</th>
                    <th style={styles.th}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} data-testid="order-history-item">
                      <td style={styles.td}>{order.orderNumber}</td>
                      <td style={styles.td}>{formatTime(order.createdAt)}</td>
                      <td style={styles.td}>
                        {order.items.map((item, idx) => (
                          <div key={idx}>
                            {item.menuName} × {item.quantity}
                          </div>
                        ))}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        {formatAmount(order.totalAmount)}원
                      </td>
                      <td style={styles.td}>{getStatusLabel(order.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 빈 상태 메시지 */}
          {!isLoading && !error && orders.length === 0 && (
            <p data-testid="order-history-empty" style={styles.empty}>
              {emptyMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryModal;

/** 인라인 스타일 정의 */
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '720px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 8px',
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  dateInput: {
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  },
  showAllButton: {
    padding: '6px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
  },
  loading: {
    textAlign: 'center',
    padding: '32px 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  error: {
    margin: 0,
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#dc2626',
    fontSize: '13px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: '2px solid #e5e7eb',
    color: '#6b7280',
    fontWeight: 600,
    fontSize: '13px',
  },
  td: {
    padding: '10px',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'top',
    color: '#374151',
  },
  empty: {
    textAlign: 'center',
    padding: '32px 0',
    color: '#9ca3af',
    fontSize: '14px',
  },
};
