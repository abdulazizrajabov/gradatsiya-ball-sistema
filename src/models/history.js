// src/models/history.js

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('History', {
        type: {
            type: DataTypes.ENUM('bonus', 'penalty', 'purchase_request', 'purchase', 'purchase_rejected'),
            allowNull: false,
        },
        points: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        teacher_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        timestamps: true,
        underscored: true,
    });
};
