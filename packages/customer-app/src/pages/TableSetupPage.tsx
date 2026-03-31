import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

// US-01: 테이블 초기 설정 화면
export default function TableSetupPage() {
  const [storeId, setStoreId] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // 폼 유효성 검증
    if (!storeId.trim() || !tableNumber.trim() || !password) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    const num = parseInt(tableNumber, 10);
    if (isNaN(num) || num <= 0) {
      setError('테이블 번호는 양의 정수여야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(storeId.trim(), num, password);
      setAuth({ token: result.token, sessionId: result.sessionId, storeId: storeId.trim(), tableNumber: num });
      navigate('/menu');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || '설정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 32 }}>🍽️ 냠픽</h1>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>테이블 설정</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="storeId">매장 식별자</label>
          <input
            id="storeId"
            data-testid="setup-store-id-input"
            type="text"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            style={{ width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box', marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="tableNumber">테이블 번호</label>
          <input
            id="tableNumber"
            data-testid="setup-table-number-input"
            type="number"
            min="1"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            style={{ width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box', marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            data-testid="setup-password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box', marginTop: 4 }}
          />
        </div>
        {error && (
          <p data-testid="setup-error-message" style={{ color: 'red', marginBottom: 16 }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          data-testid="setup-submit-button"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: 14,
            fontSize: 18,
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            minHeight: 44,
          }}
        >
          {isLoading ? '설정 중...' : '설정 완료'}
        </button>
      </form>
    </div>
  );
}
