import React, { useState, useEffect } from 'react';
import { Menu, createMenu, updateMenu as updateMenuApi } from '../services/menuApi';

interface Props {
  menu: Menu | null;
  onClose: () => void;
  onSaved: () => void;
}

const MenuForm: React.FC<Props> = ({ menu, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (menu) {
      setName(menu.name);
      setPrice(String(menu.price));
      setDescription(menu.description || '');
      setCategory(menu.category);
      setImageUrl(menu.imageUrl || '');
    }
  }, [menu]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '메뉴명을 입력해주세요';
    else if (name.length > 100) e.name = '메뉴명은 100자 이하여야 합니다';
    const p = Number(price);
    if (!price) e.price = '가격을 입력해주세요';
    else if (isNaN(p) || p < 100 || p > 1_000_000) e.price = '가격은 100원 ~ 1,000,000원 사이여야 합니다';
    if (!category.trim()) e.category = '카테고리를 입력해주세요';
    else if (category.length > 50) e.category = '카테고리는 50자 이하여야 합니다';
    if (description.length > 500) e.description = '설명은 500자 이하여야 합니다';
    if (imageUrl && !/^https?:\/\/.+/.test(imageUrl)) e.imageUrl = '올바른 이미지 URL을 입력해주세요 (http:// 또는 https://)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const data = { name: name.trim(), price: Number(price), description: description || undefined, category: category.trim(), imageUrl: imageUrl || undefined };
      if (menu) await updateMenuApi(menu._id, data);
      else await createMenu(data);
      onSaved();
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.message || '저장 실패' });
    } finally {
      setIsLoading(false);
    }
  };

  const fieldStyle = { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const };
  const errStyle = { color: 'red', fontSize: 12, marginTop: 4 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 400, maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px' }}>{menu ? '메뉴 수정' : '메뉴 등록'}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label>메뉴명 *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} />
            {errors.name && <div style={errStyle}>{errors.name}</div>}
          </div>
          <div>
            <label>가격 (원) *</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={fieldStyle} />
            {errors.price && <div style={errStyle}>{errors.price}</div>}
          </div>
          <div>
            <label>카테고리 *</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} style={fieldStyle} />
            {errors.category && <div style={errStyle}>{errors.category}</div>}
          </div>
          <div>
            <label>설명</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={fieldStyle} />
            {errors.description && <div style={errStyle}>{errors.description}</div>}
          </div>
          <div>
            <label>이미지 URL</label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={fieldStyle} />
            {errors.imageUrl && <div style={errStyle}>{errors.imageUrl}</div>}
          </div>
          {errors.submit && <div style={errStyle}>{errors.submit}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>취소</button>
            <button onClick={handleSubmit} disabled={isLoading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>{isLoading ? '저장 중...' : '저장'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuForm;
