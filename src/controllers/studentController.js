const db = require('../models');
const User = db.User;
const Class = db.Class;
const Reward = db.Reward;
const History = db.History;
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN ,{ polling: false });

exports.createStudent = async (req, res) => {
    try {
        const { telegram_id, full_name, class_id, role, password } = req.body;
        if (!telegram_id || !full_name || !role) {
            return res.status(400).json({ error: 'Telegram id or Full name or Role Not Found' });
        }
        if (role === "teacher" && !password) {
            return res.status(400).json({error: "Password is required"});
        }

        if (role === "student") {
            const userClass = await Class.findByPk(class_id);
            if (!userClass) {
                return res.status(400).json({error: "Class is not found"});
            }
        }

        const user = await User.create({ telegram_id, role, full_name, class_id, password });
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.addReward = async (req, res) => {
    try {
        const { rewardId, userId, reason, chatId } = req.body;
        if (!rewardId || !userId) {
            return res.status(400).json({ error: 'Reward or User Not Found' });
        }

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const reward = await Reward.findByPk(rewardId);

        if (!reward) return res.status(404).json({ error: 'Reward not found' });

        if (reward.type === "penalty") {
            user.total_points -= reward.points;
        }else if (reward.type === "bonus") {
            user.total_points += reward.points;
        }

        await user.save();

        await History.create({
            student_id: +userId,
            teacher_id: +req.user.id,
            points: reward.points,
            type: reward.type,
            reason
        });
        const message = `Вам ${reward.type === 'bonus' ? 'начислено' : 'списано'} ${reward.points} баллов за: ${reason}`;
        await bot.sendMessage(chatId, message);

        res.status(200).json({message: "Success"});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const students = await User.findAll();
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getStudentById = async (req, res) => {
    try {
        const student = await User.findByPk(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const student = await User.findByPk(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const { telegram_id, full_name, class_id, total_points } = req.body;
        await student.update({ telegram_id, full_name, class_id, total_points });
        res.json(student);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const student = await User.findByPk(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });
        await student.destroy();
        res.json({ message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
