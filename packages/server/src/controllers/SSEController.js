const { v4: uuidv4 } = require('uuid');
const sseService = require('../services/SSEService');

/**
 * SSEController - SSE 연결 관리
 */
const SSEController = {
  /**
   * SSE 구독 - GET /api/sse/orders
   * query: { storeId }
   * JWT 인증 필수 (role: admin)
   */
  subscribe(req, res) {
    const { storeId } = req.query;

    // storeId 검증: JWT의 storeId와 일치해야 함
    if (!storeId || storeId !== req.user.storeId) {
      return res.status(401).json({ message: '인증 정보가 일치하지 않습니다.' });
    }

    // SSE 헤더 설정
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // 클라이언트 등록
    const clientId = uuidv4();
    sseService.addClient(storeId, clientId, res);

    // 초기 연결 확인 메시지
    res.write(`data: ${JSON.stringify({ event: 'connected', clientId })}\n\n`);

    // 연결 해제 시 클린업
    req.on('close', () => {
      sseService.removeClient(storeId, clientId);
    });
  },
};

module.exports = SSEController;
