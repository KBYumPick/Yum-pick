import React, { useEffect, useState } from 'react';

// TODO: @yumpick/shared 패키지 설정 후 import 경로 변경
import type { ITable, ITableFormData } from '../../../shared/src/types';

import { useAdminTableStore } from '../stores/adminTableStore';
import TableCard from '../components/TableCard';
import TableForm from '../components/TableForm';
import OrderHistoryModal from '../components/OrderHistoryModal';

/** 테이블 관리 페이지 — 라우트: /tables */
const TableManagementPage: React.FC = () => {
  const {
    tables,
    isLoading,
    error,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    endTableSession,
  } = useAdminTableStore();

  // 로컬 상태
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<ITable | null>(null);
  const [historyTableId, setHistoryTableId] = useState<string | null>(null);

  // 마운트 시 테이블 목록 조회
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // --- 핸들러 ---

  /** 테이블 추가 버튼 클릭 */
  const handleAddTable = () => {
    setEditingTable(null);
    setIsFormOpen(true);
  };

  /** 테이블 수정 버튼 클릭 */
  const handleEdit = (table: ITable) => {
    setEditingTable(table);
    setIsFormOpen(true);
  };

  /** 테이블 삭제 — 확인 팝업 후 삭제 */
  const handleDelete = async (tableId: string) => {
    if (window.confirm('테이블을 삭제하시겠습니까?')) {
      await deleteTable(tableId);
    }
  };

  /** 세션 종료 — 확인 팝업 후 종료 */
  const handleEndSession = async (tableId: string) => {
    if (
      window.confirm(
        '테이블 세션을 종료하시겠습니까? 현재 주문 내역은 과거 이력으로 이동됩니다.',
      )
    ) {
      await endTableSession(tableId);
    }
  };

  /** 주문 내역 보기 */
  const handleViewHistory = (tableId: string) => {
    setHistoryTableId(tableId);
  };

  /** 폼 제출 (등록/수정) */
  const handleFormSubmit = async (data: ITableFormData) => {
    if (editingTable) {
      // 수정 모드
      await updateTable(editingTable._id, {
        tableNumber: data.tableNumber,
        password: data.password || undefined,
      });
    } else {
      // 등록 모드
      await createTable(data);
    }
    setIsFormOpen(false);
    setEditingTable(null);
  };

  /** 폼 닫기 */
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTable(null);
  };

  /** 주문 내역 모달 닫기 */
  const handleHistoryClose = () => {
    setHistoryTableId(null);
  };

  // 주문 내역 모달에 전달할 테이블 번호 조회
  const historyTable = historyTableId
    ? tables.find((t) => t._id === historyTableId)
    : null;

  return (
    <div data-testid="table-management-page" style={styles.page}>
      {/* 헤더 */}
      <div style={styles.header}>
        <h1 style={styles.title}>테이블 관리</h1>
        <button
          data-testid="add-table-button"
          style={styles.addButton}
          onClick={handleAddTable}
        >
          + 테이블 추가
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && <p style={styles.error}>{error}</p>}

      {/* 로딩 상태 */}
      {isLoading && tables.length === 0 && (
        <p style={styles.loading}>불러오는 중...</p>
      )}

      {/* 테이블 카드 그리드 */}
      <div data-testid="table-grid" style={styles.grid}>
        {tables.map((table) => (
          <div key={table._id} data-testid={`table-card-${table.tableNumber}`}>
            <TableCard
              table={table}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onEndSession={handleEndSession}
              onViewHistory={handleViewHistory}
            />
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {!isLoading && tables.length === 0 && !error && (
        <p style={styles.empty}>등록된 테이블이 없습니다. 테이블을 추가해주세요.</p>
      )}

      {/* TableForm 모달 */}
      {isFormOpen && (
        <TableForm
          table={editingTable}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* OrderHistoryModal */}
      {historyTableId && historyTable && (
        <OrderHistoryModal
          tableId={historyTableId}
          tableNumber={historyTable.tableNumber}
          onClose={handleHistoryClose}
        />
      )}
    </div>
  );
};

export default TableManagementPage;

/** 인라인 스타일 정의 */
const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    margin: '0 0 16px 0',
    padding: '10px 14px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#9ca3af',
    fontSize: '14px',
  },
};
