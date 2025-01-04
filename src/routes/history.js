const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const authenticateToken = require('../middleware/auth');

// Добавление записи в историю
router.post('/', authenticateToken, historyController.addHistory);

// Фильтрация истории
router.get('/', authenticateToken, historyController.getHistory);

module.exports = router;
