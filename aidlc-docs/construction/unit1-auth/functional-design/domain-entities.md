# Domain Entities - Unit 1: 인증 (채원)

## 1. AdminAccount (관리자 계정)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| storeId | string | Yes | 매장 식별자 (고유) |
| username | string | Yes | 관리자 사용자명 |
| passwordHash | string | Yes | bcrypt 해싱된 비밀번호 |
| createdAt | Date | Auto | 생성 시각 |

- MVP 단계: 매장당 1개 고정 계정
- storeId가 매장을 식별하는 기본 키 역할

## 2. TableCredential (테이블 인증 정보)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| storeId | string | Yes | 매장 식별자 |
| tableNumber | number | Yes | 테이블 번호 |
| passwordHash | string | Yes | bcrypt 해싱된 테이블 비밀번호 |

- TableModel의 인증 관련 서브셋
- 테이블 로그인 시 이 정보로 검증

## 3. AuthToken (인증 토큰 페이로드)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 계정 ID (관리자: storeId, 테이블: tableId) |
| role | 'admin' \| 'table' | 역할 구분 |
| storeId | string | 매장 식별자 |
| sessionId | string \| undefined | 테이블 전용 세션 ID |
| iat | number | 발급 시각 (JWT 자동) |
| exp | number | 만료 시각 (JWT 자동, 16시간) |

## 4. LoginAttemptRecord (로그인 시도 기록)

| 필드 | 타입 | 설명 |
|------|------|------|
| key | string | `${storeId}:${identifier}` 형태 |
| count | number | 실패 횟수 |
| lockedUntil | Date \| null | 잠금 해제 시각 |

- 인메모리 Map으로 관리 (MVP 단계, 서버 재시작 시 초기화)
- identifier: 관리자는 username, 테이블은 tableNumber

## 5. TableSession (테이블 세션)

| 필드 | 타입 | 설명 |
|------|------|------|
| sessionId | string | UUID v4 생성 |
| tableId | string | 테이블 MongoDB ObjectId |
| storeId | string | 매장 식별자 |
| startedAt | Date | 세션 시작 시각 |
| expiresAt | Date | 세션 만료 시각 (startedAt + 16h) |

- JWT 페이로드에 포함되어 전달
- TableModel의 currentSessionId와 연동
