const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authenticate: authenticateToken } = require('../middleware/authMiddleware.js');

// Добавление записи в историю
router.post('/', authenticateToken, historyController.addHistory);

// Фильтрация истории
router.get('/', authenticateToken, historyController.getHistory);

module.exports = router;
