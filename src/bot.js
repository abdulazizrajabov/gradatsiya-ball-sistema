// src/bot.js

const { Telegraf, Markup, Scenes, session } = require('telegraf');
const db = require('./models');
const User = db.User;
const Class = db.Class;
const StoreItem = db.StoreItem;
const History = db.History;
const { notifyAdmin, notifyStudent } = require('./utils/notifications');
require('dotenv').config();

// Инициализация бота
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Получение списка администраторов из переменной окружения
const adminIds = process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => id.trim());

// Проверка, является ли пользователь администратором
const isAdmin = (telegramId) => adminIds.includes(telegramId.toString());

// Использование Session Middleware
bot.use(session());

// Определение сцен для команды /addstudent и /addclass
const { BaseScene, Stage } = Scenes;

// Создание сцены для добавления ученика
const addStudentScene = new BaseScene('ADD_STUDENT_SCENE');

addStudentScene.enter((ctx) => {
    console.log('Сцена ADD_STUDENT_SCENE: Вход');
    ctx.reply('Введите Telegram ID ученика:');
});

addStudentScene.on('text', async (ctx) => {
    const step = ctx.session.step || 'telegram_id';

    if (step === 'telegram_id') {
        const studentTelegramId = ctx.message.text.trim();
        console.log(`Ввод Telegram ID: ${studentTelegramId}`);
        if (isNaN(studentTelegramId)) {
            ctx.reply('Некорректный Telegram ID. Пожалуйста, введите числовой Telegram ID ученика:');
            return;
        }
        // Проверка существования ученика
        const existingUser = await User.findOne({ where: { telegram_id: studentTelegramId } });
        if (existingUser) {
            ctx.reply('Ученик с этим Telegram ID уже зарегистрирован.');
            ctx.scene.leave();
            return;
        }
        ctx.session.studentTelegramId = studentTelegramId;
        ctx.session.step = 'full_name';
        ctx.reply('Введите полное имя ученика:');
    } else if (step === 'full_name') {
        const fullName = ctx.message.text.trim();
        console.log(`Ввод полного имени: ${fullName}`);
        if (!fullName) {
            ctx.reply('Полное имя не может быть пустым. Пожалуйста, введите полное имя ученика:');
            return;
        }
        ctx.session.fullName = fullName;

        // Выбор класса для ученика
        const classes = await Class.findAll();
        if (classes.length === 0) {
            ctx.reply('Нет доступных классов. Пожалуйста, создайте класс через админку.');
            ctx.scene.leave();
            return;
        }

        const classButtons = classes.map(cls => [Markup.button.callback(cls.name, `select_class_${cls.id}`)]);
        ctx.reply('Выберите класс ученика:', Markup.inlineKeyboard(classButtons).oneTime().resize());
        ctx.session.step = 'class_selection';
    }
});

// Добавление обработчика выбора класса внутри сцены
addStudentScene.action(/^select_class_(\d+)$/, async (ctx) => {
    const classId = ctx.match[1];
    console.log(`Администратор выбрал класс с ID: ${classId}`);

    // Получение выбранного класса из базы данных
    const selectedClass = await Class.findByPk(classId);
    if (!selectedClass) {
        ctx.reply('Выбранный класс не найден. Пожалуйста, попробуйте снова.');
        ctx.scene.leave();
        return;
    }

    // Получение данных ученика из ctx.session
    const studentTelegramId = ctx.session.studentTelegramId;
    const fullName = ctx.session.fullName;

    if (!studentTelegramId || !fullName) {
        ctx.reply('Произошла ошибка при получении данных ученика. Пожалуйста, начните процесс заново.');
        ctx.scene.leave();
        return;
    }

    // Создание нового ученика
    try {
        const newUser = await User.create({
            telegram_id: studentTelegramId,
            full_name: fullName,
            class_id: selectedClass.id,
        });

        ctx.reply(`Ученик ${newUser.full_name} успешно добавлен в класс ${selectedClass.name}.`);
        ctx.scene.leave();

        // Уведомление ученика
        await notifyStudent(bot, studentTelegramId, `Вы были добавлены в систему управления баллами в классе ${selectedClass.name}. Используйте /start для доступа к меню.`);

        // Уведомление администраторов о добавлении нового ученика
        await notifyAdmin(bot, `🧑‍🏫 Новый ученик добавлен: ${newUser.full_name} (Telegram ID: ${newUser.telegram_id}) в класс ${selectedClass.name}.`);
        console.log(`Ученик ${newUser.full_name} добавлен в класс ${selectedClass.name}`);
    } catch (error) {
        console.error('Ошибка при добавлении ученика:', error);
        ctx.reply('Произошла ошибка при добавлении ученика. Пожалуйста, попробуйте позже.');
        ctx.scene.leave();
    }
});

// Создание сцены для добавления класса
const addClassScene = new BaseScene('ADD_CLASS_SCENE');

addClassScene.enter((ctx) => {
    console.log('Сцена ADD_CLASS_SCENE: Вход');
    ctx.reply('Введите название нового класса:');
});

addClassScene.on('text', async (ctx) => {
    const className = ctx.message.text.trim();
    console.log(`Ввод названия класса: ${className}`);

    if (!className) {
        ctx.reply('Название класса не может быть пустым. Пожалуйста, введите название класса:');
        return;
    }

    // Проверка, существует ли уже класс с таким названием
    const existingClass = await Class.findOne({ where: { name: className } });
    if (existingClass) {
        ctx.reply('Класс с таким названием уже существует.');
        ctx.scene.leave();
        return;
    }

    // Создание нового класса
    try {
        const newClass = await Class.create({ name: className });
        ctx.reply(`Класс "${newClass.name}" успешно добавлен.`);
        ctx.scene.leave();

        // Уведомление администраторов о добавлении нового класса
        await notifyAdmin(bot, `📚 Новый класс добавлен: "${newClass.name}"`);
        console.log(`Класс "${newClass.name}" добавлен и администраторы уведомлены.`);
    } catch (error) {
        console.error('Ошибка при добавлении класса:', error);
        ctx.reply('Произошла ошибка при добавлении класса. Пожалуйста, попробуйте позже.');
        ctx.scene.leave();
    }
});

// Создание Stage и регистрация сцен
const stage = new Stage([addStudentScene, addClassScene]);
bot.use(stage.middleware());

// Команда /addstudent для администраторов
bot.command('addstudent', async (ctx) => {
    const telegramId = ctx.from.id;
    console.log(`Команда /addstudent вызвана пользователем с ID: ${telegramId}`);
    if (!isAdmin(telegramId)) {
        ctx.reply('У вас нет доступа к этой команде.');
        return;
    }

    ctx.scene.enter('ADD_STUDENT_SCENE');
});

// Команда /addclass для администраторов
bot.command('addclass', async (ctx) => {
    const telegramId = ctx.from.id;
    console.log(`Команда /addclass вызвана пользователем с ID: ${telegramId}`);
    if (!isAdmin(telegramId)) {
        ctx.reply('У вас нет доступа к этой команде.');
        return;
    }

    ctx.scene.enter('ADD_CLASS_SCENE');
});

// Главное меню для учеников
const studentMenu = Markup.keyboard([
    ['Мои баллы', 'Обменять баллы'],
    ['Рейтинг по классу']
]).resize();

// Команда /start для учеников
bot.start(async (ctx) => {
    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (user) {
        ctx.reply('Добро пожаловать в систему управления баллами!', studentMenu);
    } else {
        ctx.reply('Добро пожаловать в систему управления баллами! Пожалуйста, дождитесь добавления вами администратором.');
    }
});

// Обработка команды "Мои баллы"
bot.hears('Мои баллы', async (ctx) => {
    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (!user) {
        ctx.reply('Вы не зарегистрированы. Пожалуйста, обратитесь к администратору для регистрации.');
        return;
    }
    ctx.reply(`У вас ${user.total_points} баллов.`, studentMenu);
});

// Обработка команды "Обменять баллы"
bot.hears('Обменять баллы', async (ctx) => {
    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (!user) {
        ctx.reply('Вы не зарегистрированы. Пожалуйста, обратитесь к администратору для регистрации.');
        return;
    }

    const items = await StoreItem.findAll({ where: { is_active: true } });
    if (items.length === 0) {
        ctx.reply('В магазине нет доступных товаров.');
        return;
    }

    let message = 'Доступные товары:\n';
    items.forEach(item => {
        message += `• ${item.name} - ${item.price} баллов\nОписание: ${item.description}\n\n`;
    });
    ctx.reply(message);
});

// Обработка команды "Рейтинг по классу"
bot.hears('Рейтинг по классу', async (ctx) => {
    const user = await User.findOne({ where: { telegram_id: ctx.from.id }, include: Class });
    if (!user) {
        ctx.reply('Вы не зарегистрированы. Пожалуйста, обратитесь к администратору для регистрации.');
        return;
    }

    const topStudents = await User.findAll({
        where: { class_id: user.class_id },
        order: [['total_points', 'DESC']],
        limit: 10,
    });

    let message = `Топ учеников класса ${user.Class.name}:\n`;
    topStudents.forEach((student, index) => {
        message += `${index + 1}. ${student.full_name} - ${student.total_points} баллов\n`;
    });

    ctx.reply(message);
});

// Команда /buy для учеников
bot.command('buy', async (ctx) => {
    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (!user) {
        ctx.reply('Вы не зарегистрированы. Пожалуйста, обратитесь к администратору для регистрации.');
        return;
    }

    const items = await StoreItem.findAll({ where: { is_active: true, quantity: { [db.Sequelize.Op.gt]: 0 } } });
    if (items.length === 0) {
        ctx.reply('В магазине нет доступных товаров.');
        return;
    }

    // Создание инлайн клавиатуры с товарами
    const buttons = items.map(item => [
        Markup.button.callback(`${item.name} - ${item.price} баллов`, `buy_${item.id}`)
    ]);

    ctx.reply('Выберите товар для покупки:', Markup.inlineKeyboard(buttons));
});

// Обработка нажатий на кнопки покупки
bot.action(/buy_(\d+)/, async (ctx) => {
    const itemId = ctx.match[1];
    console.log(`Покупка товара с ID: ${itemId} пользователем с ID: ${ctx.from.id}`);

    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (!user) {
        ctx.reply('Вы не зарегистрированы. Пожалуйста, обратитесь к администратору для регистрации.');
        ctx.answerCbQuery();
        return;
    }

    const item = await StoreItem.findByPk(itemId);
    if (!item || !item.is_active || item.quantity < 1) {
        ctx.reply('Выбранный товар недоступен для покупки.');
        ctx.answerCbQuery();
        return;
    }

    // Создание запроса на покупку через API
    const axios = require('axios');
    const apiUrl = process.env.API_URL || 'http://localhost:3000'; // Замените на реальный URL API

    // Предполагается, что у пользователя есть JWT токен
    // Здесь необходимо реализовать механизм получения и хранения токенов учениками
    // Для простоты, мы пропустим этот шаг и предположим, что API позволяет аутентификацию по Telegram ID

    try {
        const response = await axios.post(`${apiUrl}/store/purchase`, {
            student_id: user.id,
            item_id: item.id,
            quantity: 1, // Можно расширить для выбора количества
        }, {
            headers: {
                'Authorization': `Bearer ${user.jwt_token}`, // Предполагается, что у пользователя есть JWT токен
            }
        });
        ctx.reply(response.data.message);
    } catch (error) {
        console.error('Ошибка при запросе на покупку:', error.response ? error.response.data : error.message);
        ctx.reply('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.');
    }

    ctx.answerCbQuery();
});

// Graceful stop
bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = { bot, notifyStudent };
