/**
 * 주문 상태 열거형
 * @readonly
 * @enum {string}
 */
const OrderStatus = Object.freeze({
  PENDING: 'pending',
  PREPARING: 'preparing',
  COMPLETED: 'completed',
});

/**
 * 허용된 상태 전이 맵 (단방향만 허용)
 * @type {Record<string, string>}
 */
const ORDER_STATUS_TRANSITIONS = Object.freeze({
  [OrderStatus.PENDING]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.COMPLETED,
});

/** 장바구니 단일 메뉴 최대 수량 */
const CART_MAX_QUANTITY = 99;

/** 장바구니 단일 메뉴 최소 수량 */
const CART_MIN_QUANTITY = 1;

module.exports = { OrderStatus, ORDER_STATUS_TRANSITIONS, CART_MAX_QUANTITY, CART_MIN_QUANTITY };
