import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../stores/customerStore';

interface OrderConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 주문 최종 확인 모달 (US-07) */
export function OrderConfirmModal({ isOpen, onClose }: OrderConfirmModalProps) {
  const cart = useCustomerStore((s) => s.cart);
  const createOrder = useCustomerStore((s) => s.createOrder);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  // 카운트다운 후 메뉴 화면 리다이렉트
  useEffect(() => {
    if (!successOrderNumber) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          navigate('/menu');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [successOrderNumber, onClose, navigate]);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const order = await createOrder();
      setSuccessOrderNumber(order.orderNumber);
      setCountdown(5);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '주문에 실패했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [createOrder]);

  // 모달 닫힐 때 상태 리셋
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccessOrderNumber(null);
      setCountdown(5);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="order-confirm-overlay"
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        data-testid="order-confirm-modal"
        role="dialog"
        aria-label="주문 확인"
        style={{
          backgroundColor: '#fff', borderRadius: 16, padding: 24,
          width: '90%', maxWidth: 400, maxHeight: '80vh', overflowY: 'auto',
        }}
      >
        {successOrderNumber ? (
          /* 성공 화면 */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div
              data-testid="order-success-number"
              style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}
            >
              {successOrderNumber}
            </div>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>주문이 접수되었습니다.</p>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>
              {countdown}초 후 메뉴 화면으로 이동합니다.
            </p>
          </div>
        ) : (
          /* 확인 화면 */
          <>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>주문 확인</h2>

            <div style={{ marginBottom: 16 }}>
              {cart.map((item) => (
                <div
                  key={item.menuId}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  <span>
                    {item.menuName} × {item.quantity}
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {(item.unitPrice * item.quantity).toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '12px 0', borderTop: '2px solid #e5e7eb',
              fontSize: 16, fontWeight: 700,
            }}>
              <span>합계</span>
              <span>{totalAmount.toLocaleString()}원</span>
            </div>

            {error && (
              <p data-testid="order-error-message" style={{ color: '#ef4444', fontSize: 14, margin: '12px 0' }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                data-testid="order-cancel-button"
                onClick={onClose}
                disabled={isLoading}
                style={{
                  flex: 1, padding: '12px 0', border: '1px solid #d1d5db',
                  borderRadius: 8, backgroundColor: '#fff', fontSize: 16,
                  cursor: 'pointer', minHeight: 48,
                }}
              >
                취소
              </button>
              <button
                data-testid="order-confirm-button"
                onClick={handleConfirm}
                disabled={isLoading}
                style={{
                  flex: 1, padding: '12px 0', border: 'none', borderRadius: 8,
                  backgroundColor: isLoading ? '#93c5fd' : '#2563eb',
                  color: '#fff', fontSize: 16, fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer', minHeight: 48,
                }}
              >
                {isLoading ? '주문 중...' : '주문 확정'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
