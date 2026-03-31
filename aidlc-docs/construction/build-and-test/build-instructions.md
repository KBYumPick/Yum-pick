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

---

## 2. 환경 변수 설정 (Environment Variables)

### 2.1 서버 환경 변수 (`packages/server/.env`)

```env
MONGODB_URI=mongodb://localhost:27017/yumpick
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3000
```

### 2.2 고객 앱 환경 변수 (`packages/customer-app/.env`)

```env
VITE_API_BASE=http://localhost:3000/api
```

### 2.3 관리자 앱 환경 변수 (`packages/admin-app/.env`)

```env
VITE_API_BASE=http://localhost:3000/api
```

---

## 3. 의존성 설치 (Install Dependencies)

```bash
# 모노레포 루트에서 실행
npm install
```

---

## 4. 빌드 실행 (Build)

### 4.1 전체 일괄 빌드

```bash
npm run build --workspaces
```

### 4.2 개별 빌드

```bash
# 서버
cd packages/server && npm run build

# 고객 앱
cd packages/customer-app && npm run build

# 관리자 앱
cd packages/admin-app && npm run build
```

### 4.3 빌드 확인

- 서버: `http://localhost:3000/health` → `{ "status": "ok" }`
- 고객앱: `http://localhost:5173` (Vite dev server)
- 관리자앱: `http://localhost:5174` (Vite dev server)

---

## 5. 트러블슈팅 (Troubleshooting)

### MongoDB 연결 오류

```bash
# MongoDB 서비스 상태 확인 (macOS)
brew services list | grep mongodb
brew services start mongodb-community
```

### 포트 충돌

```bash
lsof -i :3000
kill -9 <PID>
```

### TypeScript 컴파일 오류

```bash
# shared 패키지를 먼저 빌드
cd packages/shared && npm run build

# node_modules 재설치
rm -rf node_modules packages/*/node_modules
npm install
```
