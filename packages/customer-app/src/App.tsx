import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { autoLogin, hasCredentials } from './services/authService';
import TableSetupPage from './pages/TableSetupPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';

// US-02: 자동 로그인 흐름
export default function App() {
  const [checking, setChecking] = useState(true);
  const { isAuthenticated, setAuth } = useAuthStore();

  useEffect(() => {
    (async () => {
      if (hasCredentials()) {
        const result = await autoLogin();
        if (result) {
          setAuth(result);
        }
      }
      setChecking(false);
    })();
  }, [setAuth]);

  if (checking) {
    return <div style={{ textAlign: 'center', marginTop: 100 }}>로딩 중...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<TableSetupPage />} />
        {/* Unit2 (지승): 메뉴 */}
        <Route path="/menu" element={isAuthenticated ? <div>메뉴 페이지 (Unit 2에서 구현)</div> : <Navigate to="/setup" />} />
        {/* Unit3 (유진): 주문 내역 */}
        <Route path="/orders" element={isAuthenticated ? <OrderHistoryPage /> : <Navigate to="/setup" />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/menu' : '/setup'} />} />
      </Routes>
    </BrowserRouter>
  );
}
