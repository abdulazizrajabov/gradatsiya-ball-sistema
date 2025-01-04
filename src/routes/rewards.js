const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const authenticateToken = require('../middleware/auth');

// Создание бонуса/штрафа
router.post('/', authenticateToken, rewardController.createReward);

// Получение списка бонусов/штрафов
router.get('/', authenticateToken, rewardController.getAllRewards);

// Обновление данных бонуса/штрафа
router.put('/:id', authenticateToken, rewardController.updateReward);

// Удаление бонуса/штрафа
router.delete('/:id', authenticateToken, rewardController.deleteReward);

module.exports = router;
