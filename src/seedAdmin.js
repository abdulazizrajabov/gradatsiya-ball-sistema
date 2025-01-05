// src/seedAdmin.js

const db = require('./models');
const User = db.User;
const bcrypt = require('bcrypt');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        // Синхронизация базы данных
        await db.sequelize.sync({ alter: true }); // Создаёт таблицы, если они не существуют

        // Проверка, существует ли уже администратор
        const existingAdmin = await User.findOne({ where: { role: 'admin' } });
        if (existingAdmin) {
            console.log('Администратор уже существует.');
            process.exit(0);
        }

        // Создание нового администратора
        const admin = await User.create({
            telegram_id: process.env.INITIAL_ADMIN_TELEGRAM_ID, // Добавьте эту переменную в .env
            full_name: process.env.INITIAL_ADMIN_FULL_NAME,     // Добавьте эту переменную в .env
            role: 'admin',
            password: await bcrypt.hash(process.env.INITIAL_ADMIN_PASSWORD, 10), // Если используется пароль
            class_id: null, // Администратор не принадлежит классу
            total_points: null, // Администратор не имеет баллов
        });

        console.log('Начальный администратор создан:', admin.full_name);
        process.exit(0);
    } catch (error) {
        console.error('Ошибка при создании администратора:', error);
        process.exit(1);
    }
};

seedAdmin();
