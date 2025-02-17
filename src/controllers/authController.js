// src/controllers/authController.js

const db = require('../models');
const User = db.User;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const login = async (req, res) => {
    const { telegram_id, password } = req.body;

    if (!telegram_id) {
        return res.status(400).json({ error: "Telegram ID обязателен." });
    }

    if (!password) {
        return res.status(400).json({ error: "Пароль обязателен." });
    }

    try {
        const user = await User.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { telegram_id },
                    { telegram_id2: telegram_id }
                ]
            }
        });
        if (!user) {
            return res.status(404).json({ error: "Пользователь не найден." });
        }

        const isMatch = await user.validPassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: "Неверный пароль." });
        }

        // Создание JWT токена
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.json({ token });
    } catch (error) {
        console.error('Ошибка при логине:', error);
        return res.status(500).json({ error: "Внутренняя ошибка сервера." });
    }
};

module.exports = { login };
