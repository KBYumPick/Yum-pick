import { useEffect, useState, useMemo } from 'react';
import { useAdminStore, computeDashboardViews } from '../stores/adminStore';
import { useSSE } from '../hooks/useSSE';
import { TableOrderCard } from '../components/TableOrderCard';
import { OrderDetailModal } from '../components/OrderDetailModal';
import type { DashboardView } from '../types';
import './DashboardPage.css';

export function DashboardPage() {
  const {
    auth,
    orders,
    tables,
    isLoading,
    error,
    selectedTableId,
    newOrderTableIds,
    fetchOrders,
    fetchTables,
    setSelectedTableId,
    setNewOrderFlag,
  } = useAdminStore();

  const [selectedView, setSelectedView] = useState<DashboardView | null>(null);

  // SSE 연결
  const { isConnected, error: sseError } = useSSE(auth.storeId);

  // 초기 데이터 로드
  useEffect(() => {
    fetchOrders();
    fetchTables();
  }, [fetchOrders, fetchTables]);

  // 대시보드 뷰 계산
  const dashboardViews = useMemo(
    () => computeDashboardViews(orders, tables, newOrderTableIds),
    [orders, tables, newOrderTableIds]
  );

  // 필터 적용
  const displayedViews = selectedTableId
    ? dashboardViews.filter((v) => v.tableId === selectedTableId)
    : dashboardViews;

  // 카드 클릭 → 모달 열기 + 신규 주문 플래그 해제
  const handleCardClick = (view: DashboardView) => {
    setSelectedView(view);
    if (view.hasNewOrder) {
      setNewOrderFlag(view.tableId, false);
    }
  };

  // 모달에 표시할 뷰를 최신 데이터로 갱신
  const currentModalView = selectedView
    ? dashboardViews.find((v) => v.tableId === selectedView.tableId) ?? null
    : null;

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>주문 대시보드</h1>
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● 실시간 연결됨' : '○ 연결 끊김'}
        </span>
      </div>

      {(error || sseError) && (
        <div className="dashboard__error" role="alert">
          {error || sseError}
        </div>
      )}

      {/* 테이블 필터 */}
      <div className="dashboard__filters" role="tablist" aria-label="테이블 필터">
        <button
          className={`filter-btn ${!selectedTableId ? 'filter-btn--active' : ''}`}
          onClick={() => setSelectedTableId(null)}
          role="tab"
          aria-selected={!selectedTableId}
        >
          전체
        </button>
        {dashboardViews.map((view) => (
          <button
            key={view.tableId}
            className={`filter-btn ${selectedTableId === view.tableId ? 'filter-btn--active' : ''}`}
            onClick={() => setSelectedTableId(view.tableId)}
            role="tab"
            aria-selected={selectedTableId === view.tableId}
          >
            테이블 {view.tableNumber}
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      {isLoading ? (
        <div className="dashboard__loading">로딩 중...</div>
      ) : (
        <div className="dashboard__grid">
          {displayedViews.map((view) => (
            <TableOrderCard key={view.tableId} view={view} onClick={handleCardClick} />
          ))}
          {displayedViews.length === 0 && (
            <p className="dashboard__empty">표시할 테이블이 없습니다.</p>
          )}
        </div>
      )}

      {/* 주문 상세 모달 */}
      {currentModalView && (
        <OrderDetailModal view={currentModalView} onClose={() => setSelectedView(null)} />
      )}
    </div>
  );
}
