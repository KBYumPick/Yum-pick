import { useState } from 'react';
import { useCustomerStore } from '../stores/customerStore';
import { CartItemRow } from './CartItemRow';
import { OrderConfirmModal } from './OrderConfirmModal';

interface CartComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 장바구니 슬라이드업 패널 (US-05, US-06) */
export function CartComponent({ isOpen, onClose }: CartComponentProps) {
  const cart = useCustomerStore((s) => s.cart);
  const updateQuantity = useCustomerStore((s) => s.updateQuantity);
  const removeFromCart = useCustomerStore((s) => s.removeFromCart);
  const clearCart = useCustomerStore((s) => s.clearCart);
  const [showConfirm, setShowConfirm] = useState(false);

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      <div
        data-testid="cart-overlay"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40,
        }}
      />

      {/* 패널 */}
      <div
        data-testid="cart-panel"
        role="dialog"
        aria-label="장바구니"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          maxHeight: '80vh', backgroundColor: '#fff', borderRadius: '16px 16px 0 0',
          zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* 헤더 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>장바구니</h2>
            <span style={{
              backgroundColor: '#2563eb', color: '#fff', borderRadius: 12,
              padding: '2px 8px', fontSize: 12, fontWeight: 600,
            }}>
              {cart.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {cart.length > 0 && (
              <button
                data-testid="cart-clear-button"
                onClick={() => { if (window.confirm('장바구니를 비우시겠습니까?')) clearCart(); }}
                style={{
                  border: 'none', background: 'transparent', color: '#ef4444',
                  fontSize: 14, cursor: 'pointer', padding: '4px 8px',
                }}
              >
                전체 삭제
              </button>
            )}
            <button
              data-testid="cart-close-button"
              onClick={onClose}
              aria-label="장바구니 닫기"
              style={{
                width: 44, height: 44, border: 'none', background: 'transparent',
                fontSize: 20, cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 항목 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
              장바구니가 비어있습니다.
            </p>
          ) : (
            cart.map((item) => (
              <CartItemRow
                key={item.menuId}
                item={item}
                onIncrease={(id) => updateQuantity(id, item.quantity + 1)}
                onDecrease={(id) => updateQuantity(id, item.quantity - 1)}
                onRemove={removeFromCart}
              />
            ))
          )}
        </div>

        {/* 푸터 */}
        <div style={{
          padding: '16px 20px', borderTop: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            합계: {totalAmount.toLocaleString()}원
          </div>
          <button
            data-testid="cart-order-button"
            onClick={() => setShowConfirm(true)}
            disabled={cart.length === 0}
            style={{
              padding: '12px 32px', backgroundColor: cart.length === 0 ? '#d1d5db' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 16,
              fontWeight: 600, cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              minHeight: 48,
            }}
          >
            주문하기
          </button>
        </div>
      </div>

      {/* 주문 확인 모달 */}
      <OrderConfirmModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} />
    </>
  );
}
