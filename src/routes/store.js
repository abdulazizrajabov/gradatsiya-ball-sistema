const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticate: authenticateToken } = require('../middleware/authMiddleware.js');

// Добавление товара
router.post('/items', authenticateToken, storeController.addItem);

// Получение списка товаров
router.get('/items', authenticateToken, storeController.getItems);

// Обновление товара
router.put('/items/:id', authenticateToken, storeController.updateItem);

// Удаление товара
router.delete('/items/:id', authenticateToken, storeController.deleteItem);

// Запрос на покупку
router.post('/purchase', authenticateToken, storeController.purchaseItem);

module.exports = router;
