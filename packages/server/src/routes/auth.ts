import { Router } from 'express';
import { adminLogin, tableLogin, verifyTokenEndpoint } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/admin/login', adminLogin);
router.post('/table/login', tableLogin);
router.get('/verify', authenticate, verifyTokenEndpoint);

export default router;
