# 빌드 지침 (Build Instructions)

냠픽(Yumpick) 테이블 오더 서비스 — 모노레포 빌드 가이드

---

## 1. 사전 요구사항 (Prerequisites)

| 항목 | 최소 버전 | 확인 명령 |
|------|-----------|-----------|
| Node.js | 18.x 이상 | `node --version` |
| npm | 9.x 이상 | `npm --version` |
| MongoDB | 6.x 이상 | `mongod --version` |
| TypeScript | 5.x (devDependency) | `npx tsc --version` |

```bash
# 버전 확인 예시
node --version   # v18.x.x 이상이어야 함
npm --version    # 9.x.x 이상이어야 함
mongod --version # db version v6.x.x 이상이어야 함
```

---

## 2. 환경 변수 설정 (Environment Variables)

### 2.1 서버 환경 변수 (`packages/server/.env`)

```bash
# packages/server/.env 파일 생성
cp packages/server/.env.example packages/server/.env
```

```env
# MongoDB 연결 URI
MONGODB_URI=mongodb://localhost:27017/yumpick

# JWT 서명 비밀키 (최소 32자 이상 권장)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# 서버 포트 (기본값: 4000)
PORT=4000
```

> **주의**: `JWT_SECRET`은 반드시 강력한 랜덤 문자열로 설정하세요. 프로덕션 환경에서는 절대 기본값을 사용하지 마세요.

### 2.2 고객 앱 환경 변수 (`packages/customer-app/.env`)

```env
# 백엔드 API 기본 URL
VITE_API_BASE=http://localhost:4000/api
```

### 2.3 관리자 앱 환경 변수 (`packages/admin-app/.env`)

```env
# 백엔드 API 기본 URL
VITE_API_BASE=http://localhost:4000/api
```

---

## 3. 의존성 설치 (Install Dependencies)

모노레포 루트에서 한 번에 모든 패키지 의존성을 설치합니다.

```bash
# 모노레포 루트 (yumpick/)에서 실행
npm install
```

npm workspaces가 구성되어 있으므로 `packages/server`, `packages/customer-app`, `packages/admin-app`, `packages/shared`의 의존성이 모두 설치됩니다.

설치 확인:

```bash
# 각 패키지 node_modules 확인
ls packages/server/node_modules/.bin/ts-node
ls packages/customer-app/node_modules/.bin/vite
ls packages/admin-app/node_modules/.bin/vite
```

---

## 4. 빌드 실행 (Build)

### 4.1 공유 패키지 빌드 (`packages/shared`)

다른 패키지들이 shared 타입에 의존하므로 가장 먼저 빌드합니다.

```bash
cd packages/shared
npm run build
cd ../..
```

### 4.2 서버 TypeScript 컴파일 (`packages/server`)

```bash
cd packages/server
npm run build
cd ../..
```

빌드 결과물 위치: `packages/server/dist/`

```bash
# 빌드 결과물 확인
ls packages/server/dist/
# 예상 출력: index.js, controllers/, models/, routes/, services/, middleware/
```

### 4.3 고객 앱 빌드 (`packages/customer-app`)

```bash
cd packages/customer-app
npm run build
cd ../..
```

빌드 결과물 위치: `packages/customer-app/dist/`

### 4.4 관리자 앱 빌드 (`packages/admin-app`)

```bash
cd packages/admin-app
npm run build
cd ../..
```

빌드 결과물 위치: `packages/admin-app/dist/`

### 4.5 전체 일괄 빌드 (선택사항)

```bash
# 모노레포 루트에서 모든 패키지 빌드
npm run build --workspaces
```

---

## 5. 빌드 결과물 확인 (Verify Build Artifacts)

```bash
# 서버 빌드 결과물
ls -la packages/server/dist/
# 예상: index.js 및 하위 디렉토리들

# 고객 앱 빌드 결과물
ls -la packages/customer-app/dist/
# 예상: index.html, assets/ (JS/CSS 번들)

# 관리자 앱 빌드 결과물
ls -la packages/admin-app/dist/
# 예상: index.html, assets/ (JS/CSS 번들)
```

빌드 성공 기준:
- `packages/server/dist/index.js` 파일 존재
- `packages/customer-app/dist/index.html` 파일 존재
- `packages/admin-app/dist/index.html` 파일 존재
- TypeScript 컴파일 에러 0건

---

## 6. 개발 서버 실행 (Development)

빌드 없이 개발 모드로 실행하려면:

```bash
# 터미널 1: 서버 개발 모드
cd packages/server
npm run dev

# 터미널 2: 고객 앱 개발 서버
cd packages/customer-app
npm run dev

# 터미널 3: 관리자 앱 개발 서버
cd packages/admin-app
npm run dev
```

---

## 7. 트러블슈팅 (Troubleshooting)

### 7.1 환경 변수 누락 오류

**증상**: 서버 시작 시 `Error: MONGODB_URI is not defined` 또는 유사한 오류

**해결**:
```bash
# .env 파일 존재 여부 확인
ls packages/server/.env

# 파일이 없으면 생성
cp packages/server/.env.example packages/server/.env
# 이후 .env 파일을 열어 실제 값으로 수정
```

### 7.2 MongoDB 연결 오류

**증상**: `MongoServerError: connect ECONNREFUSED 127.0.0.1:27017`

**해결**:
```bash
# MongoDB 서비스 상태 확인 (macOS)
brew services list | grep mongodb

# MongoDB 시작 (macOS)
brew services start mongodb-community

# MongoDB 시작 (Linux)
sudo systemctl start mongod

# 연결 테스트
mongosh mongodb://localhost:27017/yumpick
```

### 7.3 TypeScript 컴파일 오류

**증상**: `error TS2307: Cannot find module '...'` 또는 타입 오류

**해결**:
```bash
# shared 패키지를 먼저 빌드했는지 확인
cd packages/shared && npm run build && cd ../..

# node_modules 재설치
rm -rf node_modules packages/*/node_modules
npm install

# TypeScript 버전 확인
npx tsc --version
```

### 7.4 npm workspaces 의존성 오류

**증상**: `Cannot find module '@yumpick/shared'`

**해결**:
```bash
# 루트에서 재설치 (심볼릭 링크 재생성)
npm install

# workspace 링크 확인
ls -la node_modules/@yumpick/
```

### 7.5 포트 충돌

**증상**: `Error: listen EADDRINUSE: address already in use :::4000`

**해결**:
```bash
# 포트 사용 프로세스 확인
lsof -i :4000

# 프로세스 종료
kill -9 <PID>

# 또는 .env에서 PORT 변경
PORT=4001
```
