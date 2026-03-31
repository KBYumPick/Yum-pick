import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuthStore } from './stores/authStore';
import { restoreSession, logout } from './services/authService';
import LoginPage from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  const [checking, setChecking] = useState(true);
  const { isAuthenticated, setAuth, clearAuth } = useAdminAuthStore();

  useEffect(() => {
    const session = restoreSession();
    if (session) {
      setAuth(session);
    }
    setChecking(false);
  }, [setAuth]);

  const handleLogout = () => {
    logout();
    clearAuth();
  };

  if (checking) {
    return <div style={{ textAlign: 'center', marginTop: 100 }}>로딩 중...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Unit1 (채원): 로그인 */}
        <Route path="/login" element={<LoginPage />} />

        {/* Unit4 (덕인): 주문 대시보드 */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <div>
                <button data-testid="logout-button" onClick={handleLogout} style={{ float: 'right', margin: 16 }}>
                  로그아웃
                </button>
                <DashboardPage />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Unit5 (준형): 테이블 관리 */}
        <Route path="/tables" element={isAuthenticated ? <div>테이블 관리 (Unit 5에서 구현)</div> : <Navigate to="/login" />} />

        {/* Unit2 (지승): 메뉴 관리 */}
        <Route path="/menus" element={isAuthenticated ? <div>메뉴 관리 (Unit 2에서 구현)</div> : <Navigate to="/login" />} />

        {/* 기본 리다이렉트 */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}
