// src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;
require('dotenv').config();

const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ error: "Отсутствует заголовок авторизации." });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Отсутствует токен." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ error: "Пользователь не найден." });
        }

        req.user = user; // Добавляем пользователя в запрос
        next();
    } catch (error) {
        console.error('Ошибка аутентификации:', error);
        return res.status(401).json({ error: "Неверный или истёкший токен." });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "У вас нет доступа к этому ресурсу." });
        }
        next();
    };
};

module.exports = { authenticate, authorizeRoles };
