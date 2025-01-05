// src/routes/auth.js

const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

/**
 * @route POST /auth/login
 * @desc Вход пользователя и получение JWT токена
 * @access Public
 */
router.post('/login', login);

module.exports = router;
