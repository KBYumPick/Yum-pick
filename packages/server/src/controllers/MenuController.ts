import { Request, Response } from 'express';
import Menu from '../models/MenuModel';

export const listMenus = async (req: Request, res: Response) => {
  try {
    const { storeId, category } = req.query;
    if (!storeId) return res.status(400).json({ message: 'storeId는 필수입니다' });
    const filter: Record<string, string> = { storeId: storeId as string };
    if (category) filter.category = category as string;
    res.json(await Menu.find(filter).sort({ sortOrder: 1 }));
  } catch { res.status(500).json({ message: '메뉴 목록 조회 실패' }); }
};

export const getMenu = async (req: Request, res: Response) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu || menu.storeId !== (req as any).user?.storeId)
      return res.status(404).json({ message: '메뉴를 찾을 수 없습니다' });
    res.json(menu);
  } catch { res.status(500).json({ message: '메뉴 조회 실패' }); }
};

export const createMenu = async (req: Request, res: Response) => {
  try {
    const { name, price, description, category, imageUrl } = req.body;
    const storeId = (req as any).user?.storeId;
    const e = vld({ name, price, category, description, imageUrl }, true);
    if (e) return res.status(400).json({ message: e });
    const max = await Menu.findOne({ storeId }).sort({ sortOrder: -1 });
    const menu = await Menu.create({ storeId, name: name.trim(), price, description, category: category.trim(), imageUrl, sortOrder: max ? max.sortOrder + 1 : 0 });
    res.status(201).json(menu);
  } catch { res.status(500).json({ message: '메뉴 등록 실패' }); }
};

export const updateMenu = async (req: Request, res: Response) => {
  try {
    const storeId = (req as any).user?.storeId;
    const menu = await Menu.findById(req.params.id);
    if (!menu || menu.storeId !== storeId)
      return res.status(404).json({ message: '메뉴를 찾을 수 없습니다' });
    const { name, price, description, category, imageUrl } = req.body;
    const e = vld({ name, price, category, description, imageUrl }, false);
    if (e) return res.status(400).json({ message: e });
    if (name !== undefined) menu.name = name.trim();
    if (price !== undefined) menu.price = price;
    if (category !== undefined) menu.category = category.trim();
    if (description !== undefined) menu.description = description;
    if (imageUrl !== undefined) menu.imageUrl = imageUrl;
    await menu.save();
    res.json(menu);
  } catch { res.status(500).json({ message: '메뉴 수정 실패' }); }
};

export const deleteMenu = async (req: Request, res: Response) => {
  try {
    const storeId = (req as any).user?.storeId;
    const menu = await Menu.findById(req.params.id);
    if (!menu || menu.storeId !== storeId)
      return res.status(404).json({ message: '메뉴를 찾을 수 없습니다' });
    await menu.deleteOne();
    res.json({ success: true });
  } catch { res.status(500).json({ message: '메뉴 삭제 실패' }); }
};

export const reorderMenus = async (req: Request, res: Response) => {
  try {
    const storeId = (req as any).user?.storeId;
    const { menuIds } = req.body as { menuIds: string[] };
    if (!Array.isArray(menuIds) || !menuIds.length)
      return res.status(400).json({ message: 'menuIds 배열이 필요합니다' });
    const all = await Menu.find({ storeId });
    if (all.length !== menuIds.length)
      return res.status(400).json({ message: '모든 메뉴 ID를 포함해야 합니다' });
    const ids = new Set(all.map((m) => m._id.toString()));
    if (!menuIds.every((id) => ids.has(id)))
      return res.status(400).json({ message: '유효하지 않은 메뉴 ID가 포함되어 있습니다' });
    await Menu.bulkWrite(menuIds.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { sortOrder: i } } })));
    res.json({ success: true });
  } catch { res.status(500).json({ message: '메뉴 순서 변경 실패' }); }
};

function vld(f: { name?: string; price?: number; category?: string; description?: string; imageUrl?: string }, r: boolean): string | null {
  if (r || f.name !== undefined) { if (!f.name?.trim()) return '메뉴명을 입력해주세요'; if (f.name.length > 100) return '메뉴명은 100자 이하여야 합니다'; }
  if (r || f.price !== undefined) { if (f.price == null || isNaN(f.price) || f.price < 100 || f.price > 1_000_000) return '가격은 100원 ~ 1,000,000원 사이여야 합니다'; }
  if (r || f.category !== undefined) { if (!f.category?.trim()) return '카테고리를 입력해주세요'; if (f.category.length > 50) return '카테고리는 50자 이하여야 합니다'; }
  if (f.description !== undefined && f.description.length > 500) return '설명은 500자 이하여야 합니다';
  if (f.imageUrl && !/^https?:\/\/.+/.test(f.imageUrl)) return '올바른 이미지 URL을 입력해주세요';
  return null;
}
