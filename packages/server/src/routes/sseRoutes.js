const express = require('express');
const SSEController = require('../controllers/SSEController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// SSE 구독 엔드포인트
router.get('/orders', authenticate, requireAdmin, SSEController.subscribe);

module.exports = router;
