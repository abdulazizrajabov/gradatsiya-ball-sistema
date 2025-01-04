const db = require('../models');
const User = db.User;

exports.createStudent = async (req, res) => {
    try {
        const { telegram_id, full_name, class_id } = req.body;
        const user = await User.create({ telegram_id, full_name, class_id });
        res.status(201).json(user);
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
