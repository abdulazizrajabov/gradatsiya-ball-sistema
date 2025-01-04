// src/models/history.js

module.exports = (sequelize, DataTypes) => {
    const History = sequelize.define('History', {
        type: {
            type: DataTypes.ENUM('bonus', 'penalty', 'purchase_request', 'purchase', 'purchase_rejected'),
            allowNull: false,
        },
        points: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
    });

    // Связь с пользователем (учеником)
    History.associate = (models) => {
        History.belongsTo(models.User, { foreignKey: 'student_id', as: 'User' });
        History.belongsTo(models.Teacher, { foreignKey: 'teacher_id', as: 'Teacher' });
        History.belongsTo(models.Class, { foreignKey: 'class_id', as: 'Class' });
    };

    return History;
};
