import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuthStore } from './stores/authStore';
import { restoreSession, logout } from './services/authService';
import LoginPage from './pages/LoginPage';

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
        <Route path="/login" element={<LoginPage />} />
        {/* 대시보드/테이블관리/메뉴관리 페이지는 다른 유닛에서 구현 예정 */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <div>
                <button data-testid="logout-button" onClick={handleLogout} style={{ float: 'right', margin: 16 }}>
                  로그아웃
                </button>
                <div>대시보드 (Unit 4에서 구현)</div>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/tables" element={isAuthenticated ? <div>테이블 관리 (Unit 5에서 구현)</div> : <Navigate to="/login" />} />
        <Route path="/menus" element={isAuthenticated ? <div>메뉴 관리 (Unit 2에서 구현)</div> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}
