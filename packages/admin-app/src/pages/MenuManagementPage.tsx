import React, { useEffect, useState } from 'react';
import { Menu, fetchMenuList, deleteMenu, reorderMenus } from '../services/menuApi';
import MenuForm from '../components/MenuForm';

const MenuManagementPage: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: 실제 storeId는 AdminStore 인증에서 가져올 것 (Unit1 통합 시)
  const storeId = 'default-store';

  const load = () => {
    setIsLoading(true);
    fetchMenuList(storeId)
      .then((data) => { setMenus(data); setError(null); })
      .catch(() => setError('메뉴 목록을 불러오지 못했습니다'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: string) => {
    try { await deleteMenu(id); load(); } catch { setError('삭제 실패'); }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const swap = direction === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= menus.length) return;
    const next = [...menus];
    [next[index], next[swap]] = [next[swap], next[index]];
    setMenus(next);
    try { await reorderMenus(next.map((m) => m._id)); } catch { load(); }
  };

  const openCreate = () => { setEditingMenu(null); setIsFormOpen(true); };
  const openEdit = (m: Menu) => { setEditingMenu(m); setIsFormOpen(true); };

  if (isLoading) return <div style={{ padding: 24, textAlign: 'center' }}>로딩 중...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>메뉴 관리</h1>
        <button onClick={openCreate} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>메뉴 추가</button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
            <th style={{ padding: 10 }}>순서</th>
            <th style={{ padding: 10 }}>메뉴명</th>
            <th style={{ padding: 10 }}>카테고리</th>
            <th style={{ padding: 10 }}>가격</th>
            <th style={{ padding: 10 }}>순서 변경</th>
            <th style={{ padding: 10 }}>액션</th>
          </tr>
        </thead>
        <tbody>
          {menus.map((m, i) => (
            <tr key={m._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: 10 }}>{i + 1}</td>
              <td style={{ padding: 10 }}>{m.name}</td>
              <td style={{ padding: 10 }}>{m.category}</td>
              <td style={{ padding: 10 }}>{m.price.toLocaleString('ko-KR')}원</td>
              <td style={{ padding: 10 }}>
                <button disabled={i === 0} onClick={() => handleReorder(i, 'up')} style={{ marginRight: 4, cursor: 'pointer' }}>▲</button>
                <button disabled={i === menus.length - 1} onClick={() => handleReorder(i, 'down')} style={{ cursor: 'pointer' }}>▼</button>
              </td>
              <td style={{ padding: 10 }}>
                <button onClick={() => openEdit(m)} style={{ marginRight: 8, cursor: 'pointer' }}>수정</button>
                <button onClick={() => handleDelete(m._id)} style={{ color: 'red', cursor: 'pointer' }}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isFormOpen && <MenuForm menu={editingMenu} onClose={() => setIsFormOpen(false)} onSaved={load} />}
    </div>
  );
};

export default MenuManagementPage;
