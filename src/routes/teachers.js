const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware.js');

// Регистрация учителя
router.post('/', authenticate, authorizeRoles('admin'), teacherController.createTeacher);

// Получение списка учителей
router.get('/', authenticate, authorizeRoles('admin'), teacherController.getAllTeachers);

// Обновление данных учителя
router.put('/:id', authenticate, authorizeRoles('admin'), teacherController.updateTeacher);

// Удаление учителя
router.delete('/:id', authenticate, authorizeRoles('admin'), teacherController.deleteTeacher);

// Аутентификация учителя (логин)
router.post('/login', teacherController.login);

module.exports = router;
