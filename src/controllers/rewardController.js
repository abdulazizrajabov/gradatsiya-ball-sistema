const db = require('../models');
const Reward = db.Reward;

exports.createReward = async (req, res) => {
    try {
        const { name, type, points, description } = req.body;
        const reward = await Reward.create({ name, type, points, description });
        res.status(201).json(reward);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllRewards = async (req, res) => {
    try {
        const {filterType} = req.query;

        const rewards = await Reward.findAll({ where: !!filterType ? { type:filterType } : {} });
        res.json(rewards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateReward = async (req, res) => {
    try {
        const reward = await Reward.findByPk(req.params.id);
        if (!reward) return res.status(404).json({ error: 'Reward not found' });

        const { name, type, points, description } = req.body;
        await reward.update({ name, type, points, description });
        res.json(reward);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteReward = async (req, res) => {
    try {
        const reward = await Reward.findByPk(req.params.id);
        if (!reward) return res.status(404).json({ error: 'Reward not found' });
        await reward.destroy();
        res.json({ message: 'Reward deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
