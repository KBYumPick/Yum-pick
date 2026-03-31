const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'yumpick-secret-key';

/**
 * JWT 인증 미들웨어
 * Authorization 헤더 또는 query param token에서 JWT 추출
 */
function authMiddleware(req, res, next) {
  let token = null;

  // Authorization 헤더에서 추출
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // query param fallback (SSE용)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
}

/**
 * 관리자 권한 확인 미들웨어
 */
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };
