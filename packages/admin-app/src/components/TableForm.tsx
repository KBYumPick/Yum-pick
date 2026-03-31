import React, { useState, useEffect } from 'react';

// TODO: @yumpick/shared 패키지 설정 후 import 경로 변경
import type { ITable, ITableFormData } from '../../../shared/src/types';

interface TableFormProps {
  /** null이면 등록 모드, 값이 있으면 수정 모드 */
  table: ITable | null;
  onClose: () => void;
  onSubmit: (data: ITableFormData) => Promise<void>;
}

/** 테이블 등록/수정 폼 모달 컴포넌트 */
const TableForm: React.FC<TableFormProps> = ({ table, onClose, onSubmit }) => {
  const isEditMode = table !== null;

  // 폼 상태
  const [tableNumber, setTableNumber] = useState<string>(
    isEditMode ? String(table.tableNumber) : '',
  );
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 수정 모드에서 table prop 변경 시 초기값 재설정
  useEffect(() => {
    if (table) {
      setTableNumber(String(table.tableNumber));
      setPassword('');
      setError(null);
    } else {
      setTableNumber('');
      setPassword('');
      setError(null);
    }
  }, [table]);

  /** 폼 유효성 검증 */
  const validate = (): string | null => {
    const num = Number(tableNumber);
    if (!tableNumber.trim() || isNaN(num) || num <= 0 || !Number.isInteger(num)) {
      return '테이블 번호는 양의 정수를 입력해주세요.';
    }
    // 등록 모드에서 비밀번호 필수
    if (!isEditMode && !password.trim()) {
      return '비밀번호를 입력해주세요.';
    }
    return null;
  };

  /** 폼 제출 핸들러 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        tableNumber: Number(tableNumber),
        password,
      });
    } catch (err: unknown) {
      // API 에러 메시지를 폼 하단에 표시
      const message =
        err instanceof Error ? err.message : '요청 처리에 실패했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="table-form" style={styles.overlay}>
      <div style={styles.modal}>
        {/* 제목 */}
        <h2 data-testid="table-form-title" style={styles.title}>
          {isEditMode ? '테이블 수정' : '테이블 추가'}
        </h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* 테이블 번호 입력 */}
          <div style={styles.field}>
            <label htmlFor="tableNumber" style={styles.label}>
              테이블 번호 <span style={styles.required}>*</span>
            </label>
            <input
              id="tableNumber"
              data-testid="table-number-input"
              type="number"
              min="1"
              step="1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="테이블 번호 입력"
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          {/* 비밀번호 입력 */}
          <div style={styles.field}>
            <label htmlFor="tablePassword" style={styles.label}>
              비밀번호{' '}
              {isEditMode ? (
                <span style={styles.hint}>변경하지 않으려면 비워두세요</span>
              ) : (
                <span style={styles.required}>*</span>
              )}
            </label>
            <input
              id="tablePassword"
              data-testid="table-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditMode ? '새 비밀번호 (선택)' : '비밀번호 입력'}
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p data-testid="table-form-error" style={styles.error}>
              {error}
            </p>
          )}

          {/* 버튼 영역 */}
          <div style={styles.buttonRow}>
            <button
              type="button"
              data-testid="table-form-cancel-button"
              style={{ ...styles.button, ...styles.cancelButton }}
              onClick={onClose}
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              data-testid="table-form-submit-button"
              style={{ ...styles.button, ...styles.submitButton }}
              disabled={isLoading}
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableForm;

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
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  },
  required: {
    color: '#dc2626',
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 400,
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
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
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '8px',
  },
  button: {
    padding: '8px 20px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
};
