# Component Methods - 냠픽(Yumpick)

## Backend - Controllers

### AuthController
| Method | Route | Input | Output |
|--------|-------|-------|--------|
| adminLogin | POST /api/auth/admin/login | { storeId, username, password } | { token, expiresIn } |
| tableLogin | POST /api/auth/table/login | { storeId, tableNumber, password } | { token, sessionId, expiresIn } |
| verifyToken | GET /api/auth/verify | Authorization header | { valid, role, storeId } |

### MenuController
| Method | Route | Input | Output |
|--------|-------|-------|--------|
| listMenus | GET /api/menu/list | query: { storeId, category? } | Menu[] |
| getMenu | GET /api/menu/detail/:id | params: id | Menu |
| createMenu | POST /api/menu/create | { name, price, description, category, imageUrl } | Menu |
| updateMenu | PUT /api/menu/update/:id | { name?, price?, description?, category?, imageUrl? } | Menu |
| deleteMenu | DELETE /api/menu/delete/:id | params: id | { success } |
| updateOrder | PUT /api/menu/reorder | { menuIds: string[] } | { success } |

### OrderController
| Method | Route | Input | Output |
|--------|-------|-------|--------|
| createOrder | POST /api/order/create | { storeId, tableId, sessionId, items[], totalAmount } | Order |
| listOrders | GET /api/order/list | query: { storeId, tableId?, sessionId?, status? } | Order[] |
| getOrder | GET /api/order/detail/:id | params: id | Order |
| updateStatus | PUT /api/order/status/:id | { status } | Order |
| deleteOrder | DELETE /api/order/delete/:id | params: id | { success } |
| listHistory | GET /api/order/history | query: { storeId, tableId, date? } | Order[] |

### TableController
| Method | Route | Input | Output |
|--------|-------|-------|--------|
| listTables | GET /api/table/list | query: { storeId } | Table[] |
| createTable | POST /api/table/create | { storeId, tableNumber, password } | Table |
| updateTable | PUT /api/table/update/:id | { tableNumber?, password? } | Table |
| deleteTable | DELETE /api/table/delete/:id | params: id | { success } |
| endSession | POST /api/table/end-session/:id | params: id | { success } |

### SSEController
| Method | Route | Input | Output |
|--------|-------|-------|--------|
| subscribe | GET /api/sse/orders | query: { storeId } | SSE stream |

---

## Backend - Models

### AuthModel
| Method | Input | Output | 비고 |
|--------|-------|--------|------|
| hashPassword | password: string | hashedPassword: string | bcrypt |
| comparePassword | password, hash | boolean | |
| generateToken | payload: { id, role, storeId } | token: string | JWT, 16h 만료 |
| verifyToken | token: string | payload | |
| checkLoginAttempts | storeId, identifier | { allowed, remainingAttempts } | |

### MenuModel (Mongoose)
| Field | Type | Required | 비고 |
|-------|------|----------|------|
| storeId | String | Yes | |
| name | String | Yes | |
| price | Number | Yes | 범위 검증 |
| description | String | No | |
| category | String | Yes | |
| imageUrl | String | No | 외부 URL |
| sortOrder | Number | Yes | 노출 순서 |
| createdAt | Date | Auto | |
| updatedAt | Date | Auto | |

### OrderModel (Mongoose)
| Field | Type | Required | 비고 |
|-------|------|----------|------|
| storeId | String | Yes | |
| tableId | String | Yes | |
| sessionId | String | Yes | 테이블 세션 추적 |
| orderNumber | String | Auto | 자동 생성 |
| items | Array | Yes | { menuName, quantity, unitPrice } |
| totalAmount | Number | Yes | |
| status | String | Yes | pending/preparing/completed |
| createdAt | Date | Auto | |
| updatedAt | Date | Auto | |

### TableModel (Mongoose)
| Field | Type | Required | 비고 |
|-------|------|----------|------|
| storeId | String | Yes | |
| tableNumber | Number | Yes | |
| password | String | Yes | bcrypt 해싱 |
| currentSessionId | String | No | 활성 세션 |
| sessionStartedAt | Date | No | 세션 시작 시각 |
| isActive | Boolean | Yes | 세션 활성 여부 |
| createdAt | Date | Auto | |
| updatedAt | Date | Auto | |

---

## Frontend - Customer App

### CustomerStore (Zustand)
| State/Action | Type | 비고 |
|-------------|------|------|
| menus | Menu[] | 메뉴 목록 |
| cart | CartItem[] | 장바구니 (localStorage 동기화) |
| orders | Order[] | 주문 내역 |
| session | { token, sessionId, tableId, storeId } | 세션 정보 |
| addToCart | (menu: Menu) => void | |
| removeFromCart | (menuId: string) => void | |
| updateQuantity | (menuId: string, qty: number) => void | |
| clearCart | () => void | |
| fetchMenus | () => Promise | |
| createOrder | () => Promise | |
| fetchOrders | () => Promise | |

---

## Frontend - Admin App

### AdminStore (Zustand)
| State/Action | Type | 비고 |
|-------------|------|------|
| orders | Order[] | 주문 목록 |
| tables | Table[] | 테이블 목록 |
| menus | Menu[] | 메뉴 목록 |
| auth | { token, storeId, username } | 인증 정보 |
| login | (storeId, username, password) => Promise | |
| logout | () => void | |
| fetchOrders | () => Promise | |
| updateOrderStatus | (orderId, status) => Promise | |
| deleteOrder | (orderId) => Promise | |
| endTableSession | (tableId) => Promise | |
| fetchMenus | () => Promise | |
| createMenu | (menu) => Promise | |
| updateMenu | (id, menu) => Promise | |
| deleteMenu | (id) => Promise | |
