import React, { useEffect, useState, useMemo } from 'react';
import { Menu, fetchMenuList } from '../services/menuApi';
import MenuCard from '../components/MenuCard';

const MenuPage: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: 실제 storeId는 인증 세션에서 가져올 것 (Unit1 통합 시)
  const storeId = 'default-store';

  useEffect(() => {
    setIsLoading(true);
    fetchMenuList(storeId)
      .then(setMenus)
      .catch(() => setError('메뉴를 불러오지 못했습니다'))
      .finally(() => setIsLoading(false));
  }, []);

  const categories = useMemo(() => {
    const catMap = new Map<string, number>();
    menus.forEach((m) => { if (!catMap.has(m.category)) catMap.set(m.category, m.sortOrder); });
    return [...catMap.entries()].sort((a, b) => a[1] - b[1]).map(([c]) => c);
  }, [menus]);

  const filtered = selectedCategory ? menus.filter((m) => m.category === selectedCategory) : menus;

  const handleAdd = (menu: Menu) => {
    // TODO: Unit3(장바구니) 통합 시 addToCart 연결
    console.log('장바구니 추가:', menu.name);
  };

  if (isLoading) return <div style={{ padding: 24, textAlign: 'center' }}>로딩 중...</div>;
  if (error) return <div style={{ padding: 24, textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div>
      {/* 카테고리 탭 */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', borderBottom: '1px solid #eee' }}>
        <button onClick={() => setSelectedCategory(null)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: !selectedCategory ? '#4f46e5' : '#f3f4f6', color: !selectedCategory ? '#fff' : '#333', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}>전체</button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: selectedCategory === cat ? '#4f46e5' : '#f3f4f6', color: selectedCategory === cat ? '#fff' : '#333', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}>{cat}</button>
        ))}
      </div>
      {/* 메뉴 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, padding: 16 }}>
        {filtered.map((menu) => <MenuCard key={menu._id} menu={menu} onAdd={handleAdd} />)}
      </div>
    </div>
  );
};

export default MenuPage;
