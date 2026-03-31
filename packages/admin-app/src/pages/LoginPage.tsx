import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAdminAuthStore } from '../stores/authStore';

// US-09: 관리자 로그인 화면
export default function LoginPage() {
  const [storeId, setStoreId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAdminAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!storeId.trim() || !username.trim() || !password) {
      setError('모든 항목을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(storeId.trim(), username.trim(), password);
      setAuth(result);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 32 }}>🍽️ 냠픽 관리자</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="storeId">매장 식별자</label>
          <input
            id="storeId"
            data-testid="login-store-id-input"
            type="text"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            style={{ width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box', marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="username">사용자명</label>
          <input
            id="username"
            data-testid="login-username-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box', marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            data-testid="login-password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }}
            style={{ width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box', marginTop: 4 }}
          />
        </div>
        {error && (
          <p data-testid="login-error-message" style={{ color: 'red', marginBottom: 16 }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          data-testid="login-submit-button"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: 14,
            fontSize: 18,
            backgroundColor: '#1976D2',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            minHeight: 44,
          }}
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}
