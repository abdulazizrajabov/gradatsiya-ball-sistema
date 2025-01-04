// src/server.js

const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const db = require('./models');
const { bot } = require('./bot'); // Импорт основного бота

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Импорт маршрутов
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const classRoutes = require('./routes/classes');
const rewardRoutes = require('./routes/rewards');
const historyRoutes = require('./routes/history');
const storeRoutes = require('./routes/store');

// Использование маршрутов
app.use('/students', studentRoutes);
app.use('/teachers', teacherRoutes);
app.use('/classes', classRoutes);
app.use('/rewards', rewardRoutes);
app.use('/history', historyRoutes);
app.use('/store', storeRoutes);

// Главная страница
app.get('/', (req, res) => {
    res.send('Telegram Bot API');
});

// Запуск сервера после синхронизации базы данных
db.sequelize.sync({ alter: true }).then(() => {
    console.log('База данных синхронизирована');
    app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`);
    });
});
