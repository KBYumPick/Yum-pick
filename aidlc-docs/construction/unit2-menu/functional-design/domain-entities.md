# Domain Entities - Unit 2: 메뉴 (지승)

## 1. Menu (메뉴)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| _id | ObjectId | Auto | MongoDB 고유 ID |
| storeId | string | Yes | 매장 식별자 |
| name | string | Yes | 메뉴명 |
| price | number | Yes | 가격 (100 ~ 1,000,000원) |
| description | string | No | 메뉴 설명 |
| category | string | Yes | 카테고리 (텍스트 직접 입력) |
| imageUrl | string | No | 외부 이미지 URL |
| sortOrder | number | Yes | 노출 순서 (낮을수록 상단) |
| createdAt | Date | Auto | 생성 시각 |
| updatedAt | Date | Auto | 수정 시각 |

**인덱스**:
- `{ storeId: 1, category: 1 }` - 카테고리별 조회 최적화
- `{ storeId: 1, sortOrder: 1 }` - 순서 정렬 최적화

## 2. MenuCategory (카테고리 집합 - 가상 엔티티)

카테고리는 별도 컬렉션 없이 Menu 컬렉션에서 distinct로 추출

```
storeId로 Menu 컬렉션에서 distinct('category') 조회
→ 해당 매장의 카테고리 목록 반환
```

## 3. MenuReorderRequest (순서 변경 요청)

| 필드 | 타입 | 설명 |
|------|------|------|
| menuIds | string[] | 새 순서대로 정렬된 메뉴 ID 배열 |

- 배열 인덱스 = 새 sortOrder 값
- menuIds[0].sortOrder = 0, menuIds[1].sortOrder = 1, ...
