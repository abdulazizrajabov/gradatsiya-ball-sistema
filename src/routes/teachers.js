const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authenticateToken = require('../middleware/auth');

// Регистрация учителя
router.post('/', authenticateToken, teacherController.createTeacher);

// Получение списка учителей
router.get('/', authenticateToken, teacherController.getAllTeachers);

// Обновление данных учителя
router.put('/:id', authenticateToken, teacherController.updateTeacher);

// Удаление учителя
router.delete('/:id', authenticateToken, teacherController.deleteTeacher);

// Аутентификация учителя (логин)
router.post('/login', teacherController.login);

module.exports = router;
