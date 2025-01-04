module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        telegram_id: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        class_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Classes',
                key: 'id',
            },
        },
        total_points: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    }, {
        timestamps: true,
        underscored: true,
    });

    return User;
};
