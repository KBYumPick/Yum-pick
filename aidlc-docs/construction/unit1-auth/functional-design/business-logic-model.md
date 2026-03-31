# Business Logic Model - Unit 1: 인증 (채원)

## 1. 관리자 로그인 플로우

```
입력: { storeId, username, password }

1. 로그인 시도 제한 확인
   - key = `${storeId}:${username}`
   - lockedUntil > now → 오류 반환 (잠금 시간 안내)
   - count >= 5 → lockedUntil = now + 15분, 오류 반환

2. DB에서 AdminAccount 조회 (storeId + username)
   - 없으면 → 실패 카운트 증가, 401 반환

3. bcrypt.compare(password, passwordHash)
   - 불일치 → 실패 카운트 증가, 401 반환

4. JWT 생성
   - payload: { id: storeId, role: 'admin', storeId }
   - expiresIn: '16h'

5. 실패 카운트 초기화

6. 반환: { token, expiresIn: 57600 }
```

## 2. 테이블 로그인 플로우

```
입력: { storeId, tableNumber, password }

1. 로그인 시도 제한 확인
   - key = `${storeId}:table${tableNumber}`

2. DB에서 Table 조회 (storeId + tableNumber)
   - 없으면 → 실패 카운트 증가, 401 반환

3. bcrypt.compare(password, table.passwordHash)
   - 불일치 → 실패 카운트 증가, 401 반환

4. 새 sessionId 생성 (UUID v4)

5. Table 업데이트
   - currentSessionId = sessionId
   - sessionStartedAt = now
   - isActive = true

6. JWT 생성
   - payload: { id: table._id, role: 'table', storeId, sessionId }
   - expiresIn: '16h'

7. 실패 카운트 초기화

8. 반환: { token, sessionId, expiresIn: 57600 }
```

## 3. 토큰 검증 플로우

```
입력: Authorization: Bearer <token>

1. 헤더에서 토큰 추출
   - 없으면 → 401 반환

2. jwt.verify(token, JWT_SECRET)
   - 만료/변조 → 401 반환

3. 반환: { valid: true, role, storeId }
```

## 4. 미들웨어 인증 플로우

```
모든 보호된 라우트에 적용:

1. Authorization 헤더 확인
2. 토큰 검증 (위 3번 플로우)
3. req.user = { id, role, storeId, sessionId? } 설정
4. next() 호출

역할 검증 미들웨어 (requireAdmin):
- req.user.role !== 'admin' → 403 반환
```

## 5. 로그인 시도 제한 관리

```
인메모리 Map<string, { count: number, lockedUntil: Date | null }>

checkAndRecord(key):
  record = map.get(key) ?? { count: 0, lockedUntil: null }
  
  if record.lockedUntil && record.lockedUntil > now:
    return { allowed: false, remainingMinutes }
  
  if record.lockedUntil && record.lockedUntil <= now:
    // 잠금 해제 - 초기화
    record = { count: 0, lockedUntil: null }
  
  return { allowed: true, count: record.count }

recordFailure(key):
  record.count += 1
  if record.count >= 5:
    record.lockedUntil = now + 15분

recordSuccess(key):
  map.delete(key)
```
