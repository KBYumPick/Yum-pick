import React from 'react';

// TODO: @yumpick/shared 패키지 설정 후 import 경로 변경
import type { ITable } from '../../../shared/src/types';

/** 상대 시간 계산 헬퍼 (date-fns 없이 직접 구현) */
function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return '방금 전';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return '방금 전';
}

interface TableCardProps {
  table: ITable;
  onEdit: (table: ITable) => void;
  onDelete: (tableId: string) => void;
  onEndSession: (tableId: string) => void;
  onViewHistory: (tableId: string) => void;
}

/** 개별 테이블 카드 컴포넌트 */
const TableCard: React.FC<TableCardProps> = ({
  table,
  onEdit,
  onDelete,
  onEndSession,
  onViewHistory,
}) => {
  const { _id, tableNumber, isActive, sessionStartedAt } = table;

  return (
    <div data-testid="table-card" style={styles.card}>
      {/* 테이블 번호 */}
      <h3 style={styles.title}>테이블 {tableNumber}</h3>

      {/* 상태 배지 */}
      <span
        data-testid="table-status-badge"
        style={{
          ...styles.badge,
          backgroundColor: isActive ? '#22c55e' : '#9ca3af',
        }}
      >
        {isActive ? '이용 중' : '비어 있음'}
      </span>

      {/* 세션 시작 시각 — isActive=true일 때만 표시 */}
      {isActive && sessionStartedAt && (
        <p data-testid="table-session-time" style={styles.sessionTime}>
          세션 시작: {getRelativeTime(sessionStartedAt)}
        </p>
      )}

      {/* 액션 버튼 영역 */}
      <div style={styles.actions}>
        {/* 수정 버튼 — 항상 활성 */}
        <button
          data-testid="table-edit-button"
          style={styles.button}
          onClick={() => onEdit(table)}
        >
          수정
        </button>

        {/* 삭제 버튼 — BR-TABLE-04: isActive=true이면 비활성 */}
        <button
          data-testid="table-delete-button"
          style={{
            ...styles.button,
            ...(isActive ? styles.buttonDisabled : styles.buttonDanger),
          }}
          disabled={isActive}
          onClick={() => onDelete(_id)}
        >
          삭제
        </button>

        {/* 이용 완료 버튼 — isActive=true일 때만 활성 */}
        <button
          data-testid="table-end-session-button"
          style={{
            ...styles.button,
            ...(isActive ? styles.buttonSuccess : styles.buttonDisabled),
          }}
          disabled={!isActive}
          onClick={() => onEndSession(_id)}
        >
          이용 완료
        </button>

        {/* 주문 내역 버튼 — 항상 활성 */}
        <button
          data-testid="table-view-history-button"
          style={{ ...styles.button, ...styles.buttonInfo }}
          onClick={() => onViewHistory(_id)}
        >
          주문 내역
        </button>
      </div>
    </div>
  );
};

export default TableCard;

/** 인라인 스타일 정의 */
const styles: Record<string, React.CSSProperties> = {
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 600,
    alignSelf: 'flex-start',
  },
  sessionTime: {
    margin: 0,
    fontSize: '13px',
    color: '#6b7280',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '8px',
  },
  button: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
  buttonDanger: {
    color: '#dc2626',
    borderColor: '#fca5a5',
  },
  buttonSuccess: {
    color: '#16a34a',
    borderColor: '#86efac',
    cursor: 'pointer',
  },
  buttonInfo: {
    color: '#2563eb',
    borderColor: '#93c5fd',
  },
  buttonDisabled: {
    color: '#9ca3af',
    borderColor: '#e5e7eb',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
};
