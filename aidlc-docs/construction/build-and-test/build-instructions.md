# Build Instructions - Unit 3: 장바구니&주문

## Prerequisites
- Node.js v20+
- npm v10+
- MongoDB v7+ (로컬 또는 Atlas)

## Environment Variables

```bash
# packages/server/.env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/yumpick
JWT_SECRET=your-secret-key
```

## Build Steps

### 1. Install Dependencies
```bash
# 루트에서 전체 워크스페이스 의존성 설치
npm install
```

### 2. Build Customer App
```bash
cd packages/customer-app
npm run build
```

### 3. Start Server
```bash
cd packages/server
npm run dev
```

### 4. Verify Build Success
- 서버: `http://localhost:3000/health` → `{ "status": "ok" }`
- 고객앱: `http://localhost:5173` (Vite dev server)

## Troubleshooting

### MongoDB 연결 실패
- MongoDB가 실행 중인지 확인: `mongosh --eval "db.runCommand({ping:1})"`
- MONGODB_URI 환경변수 확인

### 포트 충돌
- 3000 또는 5173 포트가 사용 중이면 .env에서 PORT 변경
