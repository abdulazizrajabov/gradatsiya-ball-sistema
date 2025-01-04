// src/utils/notifications.js

require('dotenv').config();

// Функция для уведомления администраторов
const notifyAdmin = async (bot, message) => {
    try {
        console.log(`Отправка уведомления администратору: ${message}`);
        const adminChannelId = process.env.ADMIN_CHANNEL_ID;
        await bot.telegram.sendMessage(adminChannelId, message);
    } catch (error) {
        console.error('Ошибка при отправке уведомления администратору:', error);
    }
};

// Функция для уведомления ученика
const notifyStudent = async (bot, chatId, message) => {
    try {
        console.log(`Отправка уведомления ученику (ID: ${chatId}): ${message}`);
        await bot.telegram.sendMessage(chatId, message);
    } catch (error) {
        console.error('Ошибка при отправке сообщения ученику:', error);
    }
};

module.exports = { notifyAdmin, notifyStudent };
