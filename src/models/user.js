// src/models/user.js

const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
    class User extends Model {
        // Метод для проверки пароля (если используется)
        async validPassword(password) {
            return await bcrypt.compare(password, this.password);
        }

        // Метод для генерации JWT (опционально)
        generateJWT() {
            const jwt = require('jsonwebtoken');
            return jwt.sign(
                { id: this.id, role: this.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
        }
    }

    User.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        telegram_id: {
            type: DataTypes.BIGINT,
            unique: true,
            allowNull: false,
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('admin', 'teacher', 'student'),
            allowNull: false,
        },
        class_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Только для учеников
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true, // Установите `false`, если требуется пароль для всех пользователей
        },
        total_points: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: true, // Только для учеников
        },
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'Users',
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
    });

    return User;
};
