import { describe, it, expect } from '@jest/globals';
import { OrderStatus, ORDER_STATUS_TRANSITIONS } from '../../types/order.types.js';

describe('Order Types', () => {
  it('OrderStatus 값이 올바르다', () => {
    expect(OrderStatus.PENDING).toBe('pending');
    expect(OrderStatus.PREPARING).toBe('preparing');
    expect(OrderStatus.COMPLETED).toBe('completed');
  });

  it('상태 전이는 단방향만 허용한다', () => {
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.PENDING]).toBe(OrderStatus.PREPARING);
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.PREPARING]).toBe(OrderStatus.COMPLETED);
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.COMPLETED]).toBeUndefined();
  });

  it('역방향 전이는 허용하지 않는다', () => {
    // completed → preparing 불가
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.COMPLETED]).not.toBe(OrderStatus.PREPARING);
    // preparing → pending 불가
    expect(ORDER_STATUS_TRANSITIONS[OrderStatus.PREPARING]).not.toBe(OrderStatus.PENDING);
  });
});

describe('Order Number Format', () => {
  it('YYYYMMDD-NNN 형식이어야 한다', () => {
    const pattern = /^\d{8}-\d{3,}$/;
    expect(pattern.test('20260331-001')).toBe(true);
    expect(pattern.test('20260331-042')).toBe(true);
    expect(pattern.test('20260331-1000')).toBe(true);
    expect(pattern.test('2026031-001')).toBe(false);
    expect(pattern.test('20260331001')).toBe(false);
  });

  it('순번은 3자리 패딩이어야 한다', () => {
    const seq = 1;
    const padded = String(seq).padStart(3, '0');
    expect(padded).toBe('001');

    const seq42 = 42;
    expect(String(seq42).padStart(3, '0')).toBe('042');
  });
});
