const db = require('../models');
const Class = db.Class;

exports.createClass = async (req, res) => {
    try {
        const { name } = req.body;
        const newClass = await Class.create({ name });
        res.status(201).json(newClass);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllClasses = async (req, res) => {
    try {
        const classes = await Class.findAll();
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const classItem = await Class.findByPk(req.params.id);
        if (!classItem) return res.status(404).json({ error: 'Class not found' });

        const { name } = req.body;
        await classItem.update({ name });
        res.json(classItem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const classItem = await Class.findByPk(req.params.id);
        if (!classItem) return res.status(404).json({ error: 'Class not found' });
        await classItem.destroy();
        res.json({ message: 'Class deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
