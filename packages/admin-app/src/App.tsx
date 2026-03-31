import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';

/**
 * ============================================
 * 관리자앱 라우팅 (각 유닛 담당자가 자신의 페이지 작성)
 * ============================================
 *
 * Unit1 (채원): /login → LoginPage
 * Unit2 (지승): /menu → MenuManagementPage
 * Unit4 (덕인): /dashboard → DashboardPage ✅ 구현 완료
 * Unit5 (준형): /tables → TableManagementPage
 */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unit1 (채원): 로그인 */}
        {/* <Route path="/login" element={<LoginPage />} /> */}

        {/* Unit2 (지승): 메뉴 관리 */}
        {/* <Route path="/menu" element={<MenuManagementPage />} /> */}

        {/* Unit4 (덕인): 주문 대시보드 ✅ */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Unit5 (준형): 테이블 관리 */}
        {/* <Route path="/tables" element={<TableManagementPage />} /> */}

        {/* 기본 리다이렉트 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
