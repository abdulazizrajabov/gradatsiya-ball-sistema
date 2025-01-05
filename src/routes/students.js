const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate } = require('../middleware/authMiddleware.js'); // Правильный импорт

// Регистрация ученика
router.post('/', authenticate, studentController.createStudent);

// Получение списка учеников
router.get('/', authenticate, studentController.getAllStudents);

// Получение конкретного ученика
router.get('/:id', authenticate, studentController.getStudentById);

// Обновление данных ученика
router.put('/:id', authenticate, studentController.updateStudent);

// Удаление ученика
router.delete('/:id', authenticate, studentController.deleteStudent);

module.exports = router;
