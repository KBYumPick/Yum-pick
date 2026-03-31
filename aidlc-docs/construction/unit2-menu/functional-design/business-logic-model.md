# Business Logic Model - Unit 2: 메뉴 (지승)

## 1. 메뉴 목록 조회 (고객/관리자 공통)

```
입력: { storeId, category? }

1. storeId로 Menu 컬렉션 조회
2. category 파라미터 있으면 필터 추가
3. sortOrder 오름차순 정렬
4. 반환: Menu[]
```

## 2. 메뉴 상세 조회

```
입력: { id }

1. _id로 Menu 조회
2. 없으면 → 404 반환
3. storeId 일치 검증 (req.user.storeId)
4. 반환: Menu
```

## 3. 메뉴 등록

```
입력: { name, price, description?, category, imageUrl? }

1. 필수 필드 검증 (name, price, category)
2. 가격 범위 검증 (100 ~ 1,000,000)
3. imageUrl 형식 검증 (있는 경우)
4. 현재 최대 sortOrder 조회 → +1
5. Menu 생성 및 저장
6. 반환: 생성된 Menu
```

## 4. 메뉴 수정

```
입력: { id, name?, price?, description?, category?, imageUrl? }

1. _id로 Menu 조회 + storeId 검증
2. 없으면 → 404 반환
3. 변경된 필드만 검증 (price 있으면 범위 검증)
4. 업데이트 적용
5. 반환: 수정된 Menu
```

## 5. 메뉴 삭제

```
입력: { id }

1. _id로 Menu 조회 + storeId 검증
2. 없으면 → 404 반환
3. 삭제
4. 반환: { success: true }
```

## 6. 메뉴 순서 변경

```
입력: { menuIds: string[] }

1. menuIds 배열의 모든 ID가 해당 storeId 소속인지 일괄 검증
   - DB에서 storeId로 전체 메뉴 조회
   - 조회된 메뉴 수 != menuIds.length → 400 반환
   - 모든 ID가 조회된 메뉴에 포함되는지 확인

2. bulkWrite로 일괄 업데이트
   - menuIds.forEach((id, index) => updateOne({ _id: id }, { sortOrder: index }))

3. 반환: { success: true }
```

## 7. 카테고리 목록 추출 (내부 로직)

```
storeId로 Menu.distinct('category') 조회
→ 알파벳/가나다 순 정렬
→ 반환: string[]

* 별도 API 없이 메뉴 목록 응답에 포함하거나
  프론트엔드에서 메뉴 목록으로부터 추출
```
