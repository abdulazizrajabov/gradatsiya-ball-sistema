const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authenticateToken = require('../middleware/auth');

// Регистрация ученика
router.post('/', authenticateToken, studentController.createStudent);

// Получение списка учеников
router.get('/', authenticateToken, studentController.getAllStudents);

// Получение конкретного ученика
router.get('/:id', authenticateToken, studentController.getStudentById);

// Обновление данных ученика
router.put('/:id', authenticateToken, studentController.updateStudent);

// Удаление ученика
router.delete('/:id', authenticateToken, studentController.deleteStudent);

module.exports = router;
