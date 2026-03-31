import React from 'react';
import { Menu } from '../services/menuApi';

interface Props {
  menu: Menu;
  onAdd: (menu: Menu) => void;
}

const MenuCard: React.FC<Props> = ({ menu, onAdd }) => (
  <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
    {menu.imageUrl ? (
      <img src={menu.imageUrl} alt={menu.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
    ) : (
      <div style={{ width: '100%', height: 160, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>이미지 없음</div>
    )}
    <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
      <strong>{menu.name}</strong>
      {menu.description && <p style={{ fontSize: 13, color: '#666', margin: '4px 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{menu.description}</p>}
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
        <span style={{ fontWeight: 600 }}>{menu.price.toLocaleString('ko-KR')}원</span>
        <button onClick={() => onAdd(menu)} style={{ minWidth: 44, minHeight: 44, borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>담기</button>
      </div>
    </div>
  </div>
);

export default MenuCard;
