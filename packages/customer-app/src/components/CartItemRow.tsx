import type { CartItem } from '../types/order';
import { CART_MAX_QUANTITY } from '../types/order';

interface CartItemRowProps {
  item: CartItem;
  onIncrease: (menuId: string) => void;
  onDecrease: (menuId: string) => void;
  onRemove: (menuId: string) => void;
}

/** 장바구니 개별 항목 행 (US-05, US-06) */
export function CartItemRow({ item, onIncrease, onDecrease, onRemove }: CartItemRowProps) {
  const subtotal = item.unitPrice * item.quantity;

  return (
    <div
      data-testid={`cart-item-${item.menuId}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.menuName}
        </div>
        <div style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
          {item.unitPrice.toLocaleString()}원
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          data-testid={`cart-item-decrease-${item.menuId}`}
          onClick={() => (item.quantity === 1 ? onRemove(item.menuId) : onDecrease(item.menuId))}
          aria-label={item.quantity === 1 ? `${item.menuName} 삭제` : `${item.menuName} 수량 감소`}
          style={{
            width: 44, height: 44, border: '1px solid #d1d5db', borderRadius: 8,
            background: item.quantity === 1 ? '#fef2f2' : '#fff',
            color: item.quantity === 1 ? '#ef4444' : '#374151',
            fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {item.quantity === 1 ? '🗑' : '−'}
        </button>

        <span data-testid={`cart-item-qty-${item.menuId}`} style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>
          {item.quantity}
        </span>

        <button
          data-testid={`cart-item-increase-${item.menuId}`}
          onClick={() => onIncrease(item.menuId)}
          disabled={item.quantity >= CART_MAX_QUANTITY}
          aria-label={`${item.menuName} 수량 증가`}
          style={{
            width: 44, height: 44, border: '1px solid #d1d5db', borderRadius: 8,
            background: '#fff', fontSize: 18, cursor: item.quantity >= CART_MAX_QUANTITY ? 'not-allowed' : 'pointer',
            opacity: item.quantity >= CART_MAX_QUANTITY ? 0.4 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>

      <div style={{ minWidth: 80, textAlign: 'right', fontWeight: 600 }}>
        {subtotal.toLocaleString()}원
      </div>

      <button
        data-testid={`cart-item-remove-${item.menuId}`}
        onClick={() => onRemove(item.menuId)}
        aria-label={`${item.menuName} 삭제`}
        style={{
          width: 44, height: 44, border: 'none', background: 'transparent',
          fontSize: 18, cursor: 'pointer', color: '#9ca3af', marginLeft: 4,
        }}
      >
        ✕
      </button>
    </div>
  );
}
