const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticate: authenticateToken } = require('../middleware/authMiddleware.js');

// Создание класса
router.post('/', authenticateToken, classController.createClass);

// Получение списка классов
router.get('/', authenticateToken, classController.getAllClasses);

// Обновление данных класса
router.put('/:id', authenticateToken, classController.updateClass);

// Удаление класса
router.delete('/:id', authenticateToken, classController.deleteClass);

module.exports = router;
