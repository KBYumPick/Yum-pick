const express = require('express');
const SSEController = require('../controllers/SSEController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// SSE 구독 엔드포인트
router.get('/orders', authMiddleware, adminOnly, SSEController.subscribe);

module.exports = router;
