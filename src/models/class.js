module.exports = (sequelize, DataTypes) => {
    const Class = sequelize.define('Class', {
        name: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
    }, {
        timestamps: true,
        underscored: true,
    });

    return Class;
};
