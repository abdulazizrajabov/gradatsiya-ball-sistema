// src/controllers/storeController.js

const db = require('../models');
const StoreItem = db.StoreItem;
const History = db.History;
const User = db.User;
const { notifyAdmin } = require('../utils/notifications');
const { bot } = require('../bot'); // Импорт основного бота для отправки сообщений

exports.addItem = async (req, res) => {
    try {
        const { name, description, price, quantity, is_active } = req.body;
        const item = await StoreItem.create({ name, description, price, quantity, is_active });
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getItems = async (req, res) => {
    try {
        const { is_active } = req.query;
        const where = {};
        if (is_active !== undefined) where.is_active = is_active === 'true';
        const items = await StoreItem.findAll({ where });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const item = await StoreItem.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const { name, description, price, quantity, is_active } = req.body;
        await item.update({ name, description, price, quantity, is_active });
        res.json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await StoreItem.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        await item.destroy();
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.purchaseItem = async (req, res) => {
    try {
        const { student_id, item_id, quantity } = req.body;
        const item = await StoreItem.findByPk(item_id);
        if (!item || !item.is_active) return res.status(404).json({ error: 'Item not available' });
        if (item.quantity < quantity) return res.status(400).json({ error: 'Insufficient quantity' });

        const user = await User.findByPk(student_id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Создание запроса на покупку (история с типом 'purchase_request')
        const history = await History.create({
            student_id,
            teacher_id: null, // Если инициатор покупки не учитель
            type: 'purchase_request',
            points: item.price * quantity,
            reason: `Покупка товара: ${item.name} x${quantity}`,
            class_id: user.class_id,
        });

        // Отправка сообщения в канал администраторов с кнопками "Принять" и "Отклонить"
        const message = `🔔 Новый запрос на покупку\n\n• Ученик: ${user.full_name} (ID: ${user.id})\n• Товар: ${item.name}\n• Количество: ${quantity}\n• Стоимость: ${item.price * quantity} баллов\n\nВыберите действие:`;

        await bot.telegram.sendMessage(adminChannelId, message, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ Принять', callback_data: `accept_${history.id}` },
                        { text: '❌ Отклонить', callback_data: `reject_${history.id}` },
                    ],
                ],
            },
        });

        res.json({ message: 'Запрос на покупку отправлен администраторам.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
