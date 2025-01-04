const db = require('../models');
const History = db.History;
const { Op } = require('sequelize');
const { notifyStudent } = require('../bot');

exports.addHistory = async (req, res) => {
    try {
        const { student_id, teacher_id, type, points, reason, class_id } = req.body;
        const history = await History.create({ student_id, teacher_id, type, points, reason, class_id });

        // Обновление баллов ученика
        const user = await User.findByPk(student_id);
        user.total_points += type === 'bonus' ? points : -points;
        await user.save();

        // Уведомление ученика
        const message = `Вам ${type === 'bonus' ? 'начислено' : 'списано'} ${points} баллов за: ${reason}`;
        await notifyStudent(user.telegram_id, message);

        res.status(201).json(history);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


exports.addHistory = async (req, res) => {
    try {
        const { student_id, teacher_id, type, points, reason, class_id } = req.body;
        const history = await History.create({ student_id, teacher_id, type, points, reason, class_id });
        res.status(201).json(history);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const { student_id, teacher_id, class_id, type, date_from, date_to } = req.query;
        const where = {};

        if (student_id) where.student_id = student_id;
        if (teacher_id) where.teacher_id = teacher_id;
        if (class_id) where.class_id = class_id;
        if (type) where.type = type;
        if (date_from || date_to) {
            where.created_at = {};
            if (date_from) where.created_at[Op.gte] = new Date(date_from);
            if (date_to) where.created_at[Op.lte] = new Date(date_to);
        }

        const history = await History.findAll({ where });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
