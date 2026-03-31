/**
 * SSEService - SSE 연결 관리 및 이벤트 브로드캐스트
 * 인메모리 Map으로 storeId별 클라이언트 관리
 */
class SSEService {
  constructor() {
    // Map<storeId, Map<clientId, SSEClient>>
    this.clients = new Map();
  }

  /**
   * 클라이언트 추가
   * @param {string} storeId - 매장 ID
   * @param {string} clientId - 클라이언트 UUID
   * @param {import('express').Response} res - Express Response 객체
   */
  addClient(storeId, clientId, res) {
    if (!this.clients.has(storeId)) {
      this.clients.set(storeId, new Map());
    }
    this.clients.get(storeId).set(clientId, {
      clientId,
      storeId,
      res,
      connectedAt: new Date(),
    });
  }

  /**
   * 클라이언트 제거
   * @param {string} storeId - 매장 ID
   * @param {string} clientId - 클라이언트 UUID
   */
  removeClient(storeId, clientId) {
    const storeClients = this.clients.get(storeId);
    if (storeClients) {
      storeClients.delete(clientId);
      if (storeClients.size === 0) {
        this.clients.delete(storeId);
      }
    }
  }

  /**
   * storeId에 연결된 모든 클라이언트에게 이벤트 브로드캐스트
   * @param {string} storeId - 매장 ID
   * @param {{ event: string, data: object }} sseEvent - SSE 이벤트
   */
  broadcast(storeId, sseEvent) {
    const storeClients = this.clients.get(storeId);
    if (!storeClients) return;

    const message = `event: ${sseEvent.event}\ndata: ${JSON.stringify(sseEvent.data)}\n\n`;

    storeClients.forEach((client, clientId) => {
      try {
        client.res.write(message);
      } catch (e) {
        // 쓰기 실패 시 연결 끊김으로 간주하여 제거
        this.removeClient(storeId, clientId);
      }
    });
  }
}

// 싱글톤 인스턴스
const sseService = new SSEService();
module.exports = sseService;
