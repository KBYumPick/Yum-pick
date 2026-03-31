/**
 * TableForm 단위 테스트
 * - 등록 모드: 빈 폼, 제목 "테이블 추가", 비밀번호 필수
 * - 수정 모드: tableNumber 프리필, 제목 "테이블 수정", 비밀번호 선택 힌트
 * - 유효성 검증 에러 표시
 * - 제출 시 onSubmit에 올바른 데이터 전달
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TableForm from '../../components/TableForm';
import type { ITable } from '../../../../shared/src/types';

// --- 헬퍼 ---
const makeTable = (overrides: Partial<ITable> = {}): ITable => ({
  _id: 'table-1',
  storeId: 'store-1',
  tableNumber: 5,
  currentSessionId: null,
  sessionStartedAt: null,
  isActive: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const defaultProps = {
  table: null as ITable | null,
  onClose: jest.fn(),
  onSubmit: jest.fn().mockResolvedValue(undefined),
};

beforeEach(() => jest.clearAllMocks());

// ============================================================
describe('TableForm — 등록 모드 (table=null)', () => {
  it('제목이 "테이블 추가"이다', () => {
    render(<TableForm {...defaultProps} />);
    expect(screen.getByTestId('table-form-title')).toHaveTextContent('테이블 추가');
  });

  it('테이블 번호 입력이 비어 있다', () => {
    render(<TableForm {...defaultProps} />);
    const input = screen.getByTestId('table-number-input') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('비밀번호 없이 제출 시 유효성 에러를 표시한다', async () => {
    render(<TableForm {...defaultProps} />);

    // 테이블 번호만 입력
    fireEvent.change(screen.getByTestId('table-number-input'), { target: { value: '1' } });
    fireEvent.click(screen.getByTestId('table-form-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('table-form-error')).toHaveTextContent('비밀번호를 입력해주세요');
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('테이블 번호 없이 제출 시 유효성 에러를 표시한다', async () => {
    render(<TableForm {...defaultProps} />);

    fireEvent.change(screen.getByTestId('table-password-input'), { target: { value: '1234' } });
    fireEvent.click(screen.getByTestId('table-form-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('table-form-error')).toHaveTextContent('테이블 번호는 양의 정수를 입력해주세요');
    });
  });

  it('올바른 데이터로 제출 시 onSubmit을 호출한다', async () => {
    render(<TableForm {...defaultProps} />);

    fireEvent.change(screen.getByTestId('table-number-input'), { target: { value: '3' } });
    fireEvent.change(screen.getByTestId('table-password-input'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByTestId('table-form-submit-button'));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        tableNumber: 3,
        password: 'pass123',
      });
    });
  });
});

// ============================================================
describe('TableForm — 수정 모드 (table 전달)', () => {
  const editTable = makeTable({ tableNumber: 7 });

  it('제목이 "테이블 수정"이다', () => {
    render(<TableForm {...defaultProps} table={editTable} />);
    expect(screen.getByTestId('table-form-title')).toHaveTextContent('테이블 수정');
  });

  it('테이블 번호가 기존 값으로 프리필된다', () => {
    render(<TableForm {...defaultProps} table={editTable} />);
    const input = screen.getByTestId('table-number-input') as HTMLInputElement;
    expect(input.value).toBe('7');
  });

  it('비밀번호 힌트 텍스트가 표시된다', () => {
    render(<TableForm {...defaultProps} table={editTable} />);
    expect(screen.getByText('변경하지 않으려면 비워두세요')).toBeInTheDocument();
  });

  it('비밀번호 없이도 제출할 수 있다 (선택적 변경)', async () => {
    render(<TableForm {...defaultProps} table={editTable} />);

    fireEvent.click(screen.getByTestId('table-form-submit-button'));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        tableNumber: 7,
        password: '',
      });
    });
  });
});

// ============================================================
describe('TableForm — 취소 버튼', () => {
  it('취소 버튼 클릭 시 onClose를 호출한다', () => {
    render(<TableForm {...defaultProps} />);
    fireEvent.click(screen.getByTestId('table-form-cancel-button'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
