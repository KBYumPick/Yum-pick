# Frontend Components - Unit 2: 메뉴 (지승)

## 고객앱 (customer-app)

### 1. MenuPage (메뉴 목록 화면)

**역할**: 카테고리 탭 필터와 메뉴 카드 그리드를 제공하는 고객용 메인 메뉴 화면

**Props**: 없음 (라우트 컴포넌트)

**State**:
```typescript
{
  selectedCategory: string | null;  // 선택된 카테고리 ('전체' = null)
  isLoading: boolean;
  error: string | null;
}
```

**Zustand (CustomerStore) 연동**:
```typescript
const menus = useCustomerStore((s) => s.menus);
const fetchMenus = useCustomerStore((s) => s.fetchMenus);
```

**사용자 인터랙션 흐름**:
1. 컴포넌트 마운트 → `fetchMenus()` 호출
2. 메뉴 목록 수신 → menus 배열에서 `distinct(category)` 추출 → 카테고리 탭 렌더링
3. 카테고리 탭 클릭 → `selectedCategory` 업데이트 → 해당 카테고리 메뉴만 필터링
4. "전체" 탭 클릭 → `selectedCategory = null` → 전체 메뉴 표시
5. 필터링된 메뉴 목록을 `sortOrder` 오름차순으로 `MenuCard` 그리드 렌더링

**카테고리 탭 구성**:
```
[전체] [카테고리A] [카테고리B] ...
```
- 탭 목록: menus 배열에서 `[...new Set(menus.map(m => m.category))]` 추출
- 탭 순서: 해당 카테고리의 최소 sortOrder 기준 오름차순

**레이아웃**:
- 상단 고정: 카테고리 탭 (수평 스크롤 가능)
- 하단: 메뉴 카드 그리드 (2열 또는 반응형)

**API 연동**: `GET /api/menu/list?storeId=&category=`
- 마운트 시 전체 메뉴 1회 로드 (category 파라미터 없이)
- 카테고리 필터링은 클라이언트 사이드에서 처리

---

### 2. MenuCard (개별 메뉴 카드)

**역할**: 단일 메뉴 정보를 카드 형태로 표시하고 장바구니 추가 버튼을 제공

**Props**:
```typescript
interface MenuCardProps {
  menu: Menu;
}

interface Menu {
  _id: string;
  storeId: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  imageUrl?: string;
  sortOrder: number;
}
```

**State**: 없음 (stateless 컴포넌트)

**Zustand (CustomerStore) 연동**:
```typescript
const addToCart = useCustomerStore((s) => s.addToCart);
```

**사용자 인터랙션 흐름**:
1. "담기" 버튼 클릭 → `addToCart(menu)` 호출
2. CartStore 업데이트 → 장바구니 아이콘 뱃지 갱신 (상위 레이아웃에서 처리)

**UI 구성**:
```
┌─────────────────────┐
│  [이미지 영역]       │  ← imageUrl 있으면 표시, 없으면 placeholder
│                     │
├─────────────────────┤
│ 메뉴명              │
│ 설명 (최대 2줄)     │
│ 가격                │
│          [담기 버튼] │  ← 최소 44x44px (터치 친화적)
└─────────────────────┘
```

**가격 표시**: `price.toLocaleString('ko-KR') + '원'` (예: 12,000원)

**이미지 처리**:
- `imageUrl` 있음: `<img src={imageUrl} alt={name} />`
- `imageUrl` 없음: 기본 placeholder 이미지 표시

**API 연동**: 없음 (props로 데이터 수신)

---

## 관리자앱 (admin-app)

### 3. MenuManagementPage (메뉴 관리 화면)

**역할**: 메뉴 목록 조회, 등록/수정/삭제, 노출 순서 조정을 제공하는 관리자용 화면

**Props**: 없음 (라우트 컴포넌트)

**State**:
```typescript
{
  isFormOpen: boolean;          // MenuForm 표시 여부
  editingMenu: Menu | null;     // 수정 대상 메뉴 (null이면 신규 등록)
  isLoading: boolean;
  error: string | null;
}
```

**Zustand (AdminStore) 연동**:
```typescript
const menus = useAdminStore((s) => s.menus);
const fetchMenus = useAdminStore((s) => s.fetchMenus);
const deleteMenu = useAdminStore((s) => s.deleteMenu);
const updateMenu = useAdminStore((s) => s.updateMenu);  // 순서 변경용
```

**사용자 인터랙션 흐름**:

1. **초기 로드**
   - 마운트 → `fetchMenus()` 호출 → menus 목록 렌더링 (sortOrder 오름차순)

2. **메뉴 등록**
   - "메뉴 추가" 버튼 클릭 → `editingMenu = null`, `isFormOpen = true`
   - MenuForm 모달 표시 → 저장 완료 → `isFormOpen = false` → 목록 갱신

3. **메뉴 수정**
   - 메뉴 행의 "수정" 버튼 클릭 → `editingMenu = menu`, `isFormOpen = true`
   - MenuForm 모달 표시 (기존 값 채워짐) → 저장 완료 → `isFormOpen = false` → 목록 갱신

4. **메뉴 삭제**
   - "삭제" 버튼 클릭 → 확인 없이 즉시 `deleteMenu(menu._id)` 호출
   - 성공 → 목록에서 제거

5. **순서 변경**
   - 순서 변경 버튼 (▲ / ▼) 클릭 → 해당 메뉴와 인접 메뉴의 위치 교환
   - 변경된 전체 menuIds 배열로 `PUT /api/menu/reorder` 호출

**순서 변경 로직**:
```typescript
// ▲ 클릭: index와 index-1 교환
// ▼ 클릭: index와 index+1 교환
const reorder = (index: number, direction: 'up' | 'down') => {
  const newMenus = [...menus];
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  [newMenus[index], newMenus[swapIndex]] = [newMenus[swapIndex], newMenus[index]];
  const menuIds = newMenus.map((m) => m._id);
  // PUT /api/menu/reorder { menuIds }
};
```

**UI 구성**:
```
[메뉴 추가 버튼]

┌──────┬──────────┬──────┬──────┬──────┬──────────┐
│ 순서 │ 메뉴명   │ 카테 │ 가격 │ 순서 │  액션    │
│      │          │ 고리 │      │ 변경 │          │
├──────┼──────────┼──────┼──────┼──────┼──────────┤
│  1   │ 메뉴A    │ 한식 │ 8,000│ ▲ ▼  │ 수정 삭제│
│  2   │ 메뉴B    │ 한식 │12,000│ ▲ ▼  │ 수정 삭제│
└──────┴──────────┴──────┴──────┴──────┴──────────┘
```

**API 연동**:
- `GET /api/menu/list?storeId=` — 초기 로드
- `DELETE /api/menu/delete/:id` — 삭제
- `PUT /api/menu/reorder` — 순서 변경

---

### 4. MenuForm (메뉴 등록/수정 폼)

**역할**: 메뉴 등록 및 수정을 위한 모달 폼 컴포넌트

**Props**:
```typescript
interface MenuFormProps {
  menu: Menu | null;           // null이면 신규 등록, 값 있으면 수정
  onClose: () => void;         // 모달 닫기 콜백
  onSaved: () => void;         // 저장 완료 후 목록 갱신 콜백
}
```

**State**:
```typescript
{
  name: string;
  price: string;               // 입력은 string, 제출 시 number 변환
  description: string;
  category: string;
  imageUrl: string;
  isLoading: boolean;
  errors: {
    name?: string;
    price?: string;
    category?: string;
    imageUrl?: string;
  };
}
```

**초기값 설정**:
- `menu === null` (신규): 모든 필드 빈 값
- `menu !== null` (수정): props.menu 값으로 초기화

**Zustand (AdminStore) 연동**:
```typescript
const createMenu = useAdminStore((s) => s.createMenu);
const updateMenu = useAdminStore((s) => s.updateMenu);
```

**사용자 인터랙션 흐름**:
1. 폼 필드 입력 → 실시간 유효성 검증 (onBlur 또는 onChange)
2. "저장" 버튼 클릭 → 전체 유효성 검증
3. 검증 통과 → API 호출 (신규: `createMenu`, 수정: `updateMenu`)
4. 성공 → `onSaved()` 호출 → `onClose()` 호출
5. 실패 → 에러 메시지 표시
6. "취소" 버튼 또는 모달 외부 클릭 → `onClose()` 호출

**폼 유효성 검증 규칙**:

| 필드 | 규칙 | 에러 메시지 |
|------|------|-------------|
| name | 필수, 공백만 불가, 최대 100자 | "메뉴명을 입력해주세요" / "메뉴명은 100자 이하여야 합니다" |
| price | 필수, 숫자, 100 이상 1,000,000 이하 | "가격을 입력해주세요" / "가격은 100원 ~ 1,000,000원 사이여야 합니다" |
| category | 필수, 공백만 불가, 최대 50자 | "카테고리를 입력해주세요" / "카테고리는 50자 이하여야 합니다" |
| description | 선택, 최대 500자 | "설명은 500자 이하여야 합니다" |
| imageUrl | 선택, http:// 또는 https:// 시작 | "올바른 이미지 URL을 입력해주세요 (http:// 또는 https://)" |

**유효성 검증 구현**:
```typescript
const validate = (): boolean => {
  const newErrors: typeof errors = {};

  if (!name.trim()) newErrors.name = '메뉴명을 입력해주세요';
  else if (name.length > 100) newErrors.name = '메뉴명은 100자 이하여야 합니다';

  const priceNum = Number(price);
  if (!price) newErrors.price = '가격을 입력해주세요';
  else if (isNaN(priceNum) || priceNum < 100 || priceNum > 1_000_000)
    newErrors.price = '가격은 100원 ~ 1,000,000원 사이여야 합니다';

  if (!category.trim()) newErrors.category = '카테고리를 입력해주세요';
  else if (category.length > 50) newErrors.category = '카테고리는 50자 이하여야 합니다';

  if (description.length > 500)
    newErrors.description = '설명은 500자 이하여야 합니다';

  if (imageUrl && !/^https?:\/\/.+/.test(imageUrl))
    newErrors.imageUrl = '올바른 이미지 URL을 입력해주세요 (http:// 또는 https://)';

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**UI 구성**:
```
┌─────────────────────────────────┐
│  메뉴 등록 / 메뉴 수정          │
├─────────────────────────────────┤
│ 메뉴명 *        [____________]  │
│ 가격 (원) *     [____________]  │
│ 카테고리 *      [____________]  │
│ 설명            [____________]  │
│                 [____________]  │
│ 이미지 URL      [____________]  │
│                                 │
│          [취소]  [저장]         │
└─────────────────────────────────┘
```

**API 연동**:
- 신규 등록: `POST /api/menu/create` → `{ name, price, description, category, imageUrl }`
- 수정: `PUT /api/menu/update/:id` → `{ name?, price?, description?, category?, imageUrl? }`
