module.exports = (sequelize, DataTypes) => {
    const Reward = sequelize.define('Reward', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('bonus', 'penalty'),
            allowNull: false,
        },
        points: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
        },
    }, {
        timestamps: true,
        underscored: true,
    });

    return Reward;
};
