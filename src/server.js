// src/server.js

const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./models'); // Импорт моделей и Sequelize
const User = db.User;
const { bot } = require('./bot'); // Импорт вашего Telegram-бота

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors())

// Импорт маршрутов
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const classRoutes = require('./routes/classes');
const rewardRoutes = require('./routes/rewards');
const historyRoutes = require('./routes/history');
const storeRoutes = require('./routes/store');
const authRoutes = require('./routes/auth'); // Эндпоинты аутентификации

// Импорт middleware для аутентификации
const { authenticate, authorizeRoles } = require('./middleware/authMiddleware');

// Использование маршрутов
app.use('/auth', authRoutes); // Эндпоинты аутентификации должны быть до защищённых маршрутов

// Защищённые маршруты
app.use('/students', authenticate, studentRoutes);
app.use('/teachers', authenticate, teacherRoutes);
app.use('/classes', authenticate, classRoutes);
app.use('/rewards', authenticate, rewardRoutes);
app.use('/history', authenticate, authorizeRoles('admin'), historyRoutes);
app.use('/store', authenticate, storeRoutes); // Доступ зависит от логики

// Главная страница
app.get('/', (req, res) => {
    res.send('Telegram Bot API');
});



// Обработчик ошибок
app.use((err, req, res, next) => {
    console.error('Произошла ошибка:', err);
    res.status(err.status || 500).json({ error: err.message || 'Внутренняя ошибка сервера.' });
});

// Запуск сервера после синхронизации базы данных
db.sequelize.sync({ alter: true }).then(() => {
    console.log('База данных синхронизирована');
    app.listen(PORT, async () => {
        const admin = await User.findOne({where:{telegram_id: process.env.INITIAL_ADMIN_TELEGRAM_ID}})
        if (!admin) {
            const initialAdmin =  await User.create({
                telegram_id: process.env.INITIAL_ADMIN_TELEGRAM_ID,
                full_name: process.env.INITIAL_ADMIN_FULL_NAME,
                role: 'admin',
                password: process.env.INITIAL_ADMIN_PASSWORD,
            })
            console.log(`Initial admin created: telegram id: ${initialAdmin?.telegram_id}, full_name: ${initialAdmin?.full_name}`);
        }else {
            console.log('Admin already exists!');
        }
        console.log(`Сервер запущен на порту ${PORT}`);
    });
}).catch((error) => {
    console.error('Ошибка при синхронизации базы данных:', error);
});