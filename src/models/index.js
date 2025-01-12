const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite:./database.sqlite', {
    dialect: 'sqlite', // Замените на 'mysql' при использовании MySQL
    storage: './database.sqlite',
    logging: false,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Импорт моделей
db.User = require('./user')(sequelize, Sequelize);
db.Teacher = require('./teacher')(sequelize, Sequelize);
db.Class = require('./class')(sequelize, Sequelize);
db.Reward = require('./reward')(sequelize, Sequelize);
db.History = require('./history')(sequelize, Sequelize);
db.StoreItem = require('./storeItem')(sequelize, Sequelize);

module.exports = db;
