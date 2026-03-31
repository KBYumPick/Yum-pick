const express = require('express');
const OrderController = require('../controllers/OrderController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Unit4 담당: 주문 상태 변경 + 삭제
router.put('/status/:id', authMiddleware, adminOnly, OrderController.updateStatus);
router.delete('/delete/:id', authMiddleware, adminOnly, OrderController.deleteOrder);

module.exports = router;
