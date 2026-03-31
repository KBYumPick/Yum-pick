import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OrderHistoryPage } from './pages/OrderHistoryPage';

/**
 * 고객앱 라우팅
 * - /menu: MenuPage (Unit 2 담당, 여기서는 placeholder)
 * - /orders: OrderHistoryPage (Unit 3)
 */
function MenuPagePlaceholder() {
  return <div data-testid="menu-page-placeholder" style={{ padding: 16 }}>메뉴 페이지 (Unit 2에서 구현)</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/menu" element={<MenuPagePlaceholder />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
