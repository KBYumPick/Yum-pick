import { useCustomerStore } from '../stores/customerStore';

interface CartBadgeProps {
  onClick: () => void;
}

/** 메뉴 화면 하단 고정 장바구니 버튼 (US-05) */
export function CartBadge({ onClick }: CartBadgeProps) {
  const cart = useCustomerStore((s) => s.cart);

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  if (cart.length === 0) return null;

  return (
    <button
      data-testid="cart-badge-button"
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        padding: '14px 20px',
        backgroundColor: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        fontSize: 16,
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        minHeight: 48,
      }}
      aria-label={`장바구니 ${totalCount}개 항목, 총 ${totalAmount.toLocaleString()}원`}
    >
      <span>🛒 {totalCount}개 항목</span>
      <span>{totalAmount.toLocaleString()}원 →</span>
    </button>
  );
}
