import { Router } from 'express';
import { listMenus, getMenu, createMenu, updateMenu, deleteMenu, reorderMenus } from '../controllers/MenuController';

const router = Router();

// 고객+관리자 공통 (인증 미들웨어는 app.js 통합 시 적용)
router.get('/list', listMenus);
router.get('/detail/:id', getMenu);

// 관리자 전용
router.post('/create', createMenu);
router.put('/update/:id', updateMenu);
router.delete('/delete/:id', deleteMenu);
router.put('/reorder', reorderMenus);

export default router;
