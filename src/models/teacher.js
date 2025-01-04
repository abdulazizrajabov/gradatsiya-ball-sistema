module.exports = (sequelize, DataTypes) => {
    const Teacher = sequelize.define('Teacher', {
        username: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        timestamps: true,
        underscored: true,
    });

    return Teacher;
};
