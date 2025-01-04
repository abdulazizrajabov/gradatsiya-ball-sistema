const db = require('../models');
const Teacher = db.Teacher;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.createTeacher = async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const teacher = await Teacher.create({ username, password: hashedPassword });
        res.status(201).json({ id: teacher.id, username: teacher.username });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.findAll({
            attributes: ['id', 'username', 'created_at', 'updated_at'],
        });
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findByPk(req.params.id);
        if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

        const { username, password } = req.body;
        if (password) {
            req.body.password = await bcrypt.hash(password, 10);
        }
        await teacher.update({ username, password: req.body.password });
        res.json({ id: teacher.id, username: teacher.username });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findByPk(req.params.id);
        if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
        await teacher.destroy();
        res.json({ message: 'Teacher deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const teacher = await Teacher.findOne({ where: { username } });
        if (!teacher) return res.status(400).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, teacher.password);
        if (!match) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: teacher.id, username: teacher.username }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
