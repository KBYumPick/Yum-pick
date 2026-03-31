/**
 * OrderHistoryModal 단위 테스트
 * - 마운트 시 주문 내역 fetch
 * - 날짜 필터 변경 시 재조회
 * - "전체 보기" 버튼으로 날짜 필터 초기화
 * - 빈 상태 메시지 (필터 유무에 따라 다름)
 * - 주문 항목 렌더링
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderHistoryModal from '../../components/OrderHistoryModal';
import type { IOrderHistory } from '../../../../shared/src/types';

// --- fetch mock ---
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// localStorage stub
beforeAll(() => {
  Storage.prototype.getItem = jest.fn((key: string) => {
    if (key === 'adminToken') return 'test-token';
    if (key === 'storeId') return 'store-1';
    return null;
  });
});

beforeEach(() => {
  mockFetch.mockReset();
});

// --- 헬퍼 ---
const defaultProps = {
  tableId: 'table-1',
  tableNumber: 3,
  onClose: jest.fn(),
};

const makeOrder = (overrides: Partial<IOrderHistory> = {}): IOrderHistory => ({
  _id: 'order-1',
  storeId: 'store-1',
  tableId: 'table-1',
  sessionId: 'sess-1',
  orderNumber: 'ORD-001',
  items: [{ menuName: '김치찌개', quantity: 2, unitPrice: 8000 }],
  totalAmount: 16000,
  status: 'completed',
  createdAt: '2024-06-15T12:30:00Z',
  ...overrides,
});

const okJson = (data: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);

const failJson = (message: string) =>
  Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ message }),
  } as unknown as Response);

// ============================================================
describe('OrderHistoryModal', () => {
  it('마운트 시 주문 내역을 fetch한다', async () => {
    mockFetch.mockReturnValueOnce(okJson([]));
    render(<OrderHistoryModal {...defaultProps} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/order/history'),
        expect.objectContaining({ headers: expect.any(Object) }),
      );
    });
  });

  it('주문 내역이 없을 때 빈 상태 메시지를 표시한다 (필터 없음)', async () => {
    mockFetch.mockReturnValueOnce(okJson([]));
    render(<OrderHistoryModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('order-history-empty')).toHaveTextContent(
        '과거 주문 내역이 없습니다.',
      );
    });
  });

  it('주문 항목을 올바르게 렌더링한다', async () => {
    const orders = [
      makeOrder({ _id: 'o1', orderNumber: 'ORD-001' }),
      makeOrder({ _id: 'o2', orderNumber: 'ORD-002' }),
    ];
    mockFetch.mockReturnValueOnce(okJson(orders));
    render(<OrderHistoryModal {...defaultProps} />);

    await waitFor(() => {
      const items = screen.getAllByTestId('order-history-item');
      expect(items).toHaveLength(2);
    });

    // 메뉴명 표시 확인
    expect(screen.getAllByText(/김치찌개/)).toHaveLength(2);
  });

  it('날짜 필터 변경 시 재조회한다', async () => {
    // 초기 로드
    mockFetch.mockReturnValueOnce(okJson([]));
    render(<OrderHistoryModal {...defaultProps} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // 날짜 필터 변경
    mockFetch.mockReturnValueOnce(okJson([]));
    fireEvent.change(screen.getByTestId('order-history-date-filter'), {
      target: { value: '2024-06-15' },
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // 두 번째 호출에 date 파라미터 포함 확인
      expect(mockFetch.mock.calls[1][0]).toContain('date=2024-06-15');
    });
  });

  it('날짜 필터 적용 후 빈 상태 메시지가 날짜 관련 메시지로 변경된다', async () => {
    // 초기 로드
    mockFetch.mockReturnValueOnce(okJson([]));
    render(<OrderHistoryModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('order-history-empty')).toHaveTextContent(
        '과거 주문 내역이 없습니다.',
      );
    });

    // 날짜 필터 적용
    mockFetch.mockReturnValueOnce(okJson([]));
    fireEvent.change(screen.getByTestId('order-history-date-filter'), {
      target: { value: '2024-06-15' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('order-history-empty')).toHaveTextContent(
        '해당 날짜의 주문 내역이 없습니다.',
      );
    });
  });

  it('"전체 보기" 버튼 클릭 시 날짜 필터를 초기화하고 재조회한다', async () => {
    // 초기 로드
    mockFetch.mockReturnValueOnce(okJson([]));
    render(<OrderHistoryModal {...defaultProps} />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    // 날짜 필터 적용
    mockFetch.mockReturnValueOnce(okJson([]));
    fireEvent.change(screen.getByTestId('order-history-date-filter'), {
      target: { value: '2024-06-15' },
    });
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));

    // "전체 보기" 클릭
    mockFetch.mockReturnValueOnce(okJson([]));
    fireEvent.click(screen.getByTestId('order-history-show-all-button'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
      // 세 번째 호출에 date 파라미터 미포함 확인
      expect(mockFetch.mock.calls[2][0]).not.toContain('date=');
    });

    // 날짜 입력 필드가 초기화됨
    const dateInput = screen.getByTestId('order-history-date-filter') as HTMLInputElement;
    expect(dateInput.value).toBe('');
  });

  it('닫기 버튼 클릭 시 onClose를 호출한다', async () => {
    mockFetch.mockReturnValueOnce(okJson([]));
    render(<OrderHistoryModal {...defaultProps} />);

    fireEvent.click(screen.getByTestId('order-history-close-button'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('제목에 테이블 번호가 표시된다', async () => {
    mockFetch.mockReturnValueOnce(okJson([]));
    render(<OrderHistoryModal {...defaultProps} />);

    expect(screen.getByTestId('order-history-title')).toHaveTextContent(
      '테이블 3 - 과거 주문 내역',
    );
  });
});
