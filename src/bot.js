const { Telegraf, Markup, Scenes, session } = require('telegraf');
const db = require('./models');
const User = db.User;
const Class = db.Class;
const StoreItem = db.StoreItem;
const History = db.History;
const { notifyStudent, notifyAdmin } = require('./utils/notifications'); // Добавлено notifyAdmin
require('dotenv').config();

// Инициализация бота
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Использование Session Middleware
bot.use(session());

// Получение ID админ-канала из переменных окружения
const ADMIN_CHANNEL_ID = process.env.ADMIN_CHANNEL_ID;
if (!ADMIN_CHANNEL_ID) {
    console.error('Ошибка: ADMIN_CHANNEL_ID не задан в переменных окружения.');
    process.exit(1);
}

// Главное меню для учеников
const studentMenu = Markup.keyboard([
    ['🏅 Mening ballarim', '🔄 Ballarni almashtirish'],
    ['🏆 Sinf bo\'yicha reyting']
]).resize();

// Команда /start для учеников
bot.start(async (ctx) => {
    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (user) {
        ctx.reply('😊 Ballarni boshqarish tizimiga xush kelibsiz!', studentMenu);
    } else {
        ctx.reply('😊 Ballarni boshqarish tizimiga xush kelibsiz! Iltimos, administrator tomonidan qo\'shilishingizni kuting. ⏳');
    }
});

// Обработка команды "Мои баллы"
bot.hears('🏅 Mening ballarim', async (ctx) => {
    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (!user) {
        ctx.reply('❗ Siz ro\'yxatdan o\'tkazilmagansiz. Iltimos, ro\'yxatdan o\'tish uchun administrator bilan bog\'laning.');
        return;
    }
    ctx.reply(`🎉 Sizda ${user.total_points} ta ball bor.`, studentMenu);
});

// Обработка команды "Обменять баллы" (объединение с /buy)
bot.hears('🔄 Ballarni almashtirish', async (ctx) => {
    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (!user) {
        ctx.reply('❗ Siz ro\'yxatdan o\'tkazilmagansiz. Iltimos, ro\'yxatdan o\'tish uchun administrator bilan bog\'laning.');
        return;
    }

    const items = await StoreItem.findAll({ where: { is_active: true, quantity: { [db.Sequelize.Op.gt]: 0 } } });
    if (items.length === 0) {
        ctx.reply('🛒 Do\'konda mavjud bo\'lgan mahsulotlar yo\'q.');
        return;
    }

    // Проверка, достаточно ли у пользователя баллов для покупки
    const buttons = items.map(item => [
        Markup.button.callback(`${item.name} sotib olish - ${item.price} ball`, `buy_${item.id}`)
    ]);

    ctx.reply('🛍️ Ballarni almashtirish uchun mahsulotni tanlang: \n\n❗Diqqat qiling, tugmani bosishingiz bilan ushbu mahsulot avtomatik tarzda siz tomondan sotib olinadi va ballingiz yechiladi.', Markup.inlineKeyboard(buttons));
});

// Обработка нажатий на кнопки покупки
bot.action(/buy_(\d+)/, async (ctx) => {
    const itemId = ctx.match[1];
    console.log(`Покупка товара с ID: ${itemId} пользователем с ID: ${ctx.from.id}`);

    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (!user) {
        ctx.reply('❗ Siz ro\'yxatdan o\'tkazilmagansiz. Iltimos, ro\'yxatdan o\'tish uchun administrator bilan bog\'laning.');
        ctx.answerCbQuery();
        return;
    }

    const item = await StoreItem.findByPk(itemId);
    if (!item || !item.is_active || item.quantity < 1) {
        ctx.reply('🚫 Tanlangan mahsulot ballarni almashtirish uchun mavjud emas.');
        ctx.answerCbQuery();
        return;
    }

    if (user.total_points < item.price) {
        ctx.reply('🙁 Ushbu mahsulotni olish uchun yetarli ballaringiz yo\'q.');
        ctx.answerCbQuery();
        return;
    }

    // Начало транзакции
    const transaction = await db.sequelize.transaction();

    try {
        // Обновление баллов пользователя
        user.total_points -= item.price;
        await user.save({ transaction });

        // Обновление количества товара
        item.quantity -= 1;
        await item.save({ transaction });

        // Создание записи в истории с обязательными полями
        await History.create({
            type: 'purchase', // Тип транзакции
            points: item.price, // Количество баллов
            student_id: user.id, // ID ученика
            teacher_id: null, // Можно установить ID системного пользователя или оставить null
            reason: `Sotib olish: ${item.name}`, // Причина (можно оставить null)
        }, { transaction });

        // Подтверждение покупки
        await transaction.commit();
        ctx.reply(`🎁 Siz muvaffaqiyatli tarzda ${item.price} ballarni "${item.name}" mahsulotiga almashtirdingiz.`, studentMenu);

        // Формирование сообщения для администратора
        const adminMessage = `
📦 Sotib olish amalga oshirildi!

O'quvchi: ${user.full_name} (ID: ${user.id})
Mahsulot: ${item.name}
Narxi: ${item.price} ball
Sana: ${new Date().toLocaleString()}
        `;

        // Уведомление администратора с использованием notifyAdmin
        await notifyAdmin(bot, adminMessage);

        console.log(`Foydalanuvchi ${user.full_name} ${item.price} ballarni "${item.name}" mahsulotiga almashtirdi.`);
    } catch (error) {
        await transaction.rollback();
        console.error('Ballarni almashtirishda xato:', error);
        ctx.reply('⚠️ Ballarni almashtirishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.');
    }

    ctx.answerCbQuery();
});

// Обработка команды "Рейтинг по классу"
bot.hears('🏆 Sinf bo\'yicha reyting', async (ctx) => {
    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (!user) {
        ctx.reply('❗ Siz ro\'yxatdan o\'tkazilmagansiz. Iltimos, ro\'yxatdan o\'tish uchun administrator bilan bog\'laning.');
        return;
    }

    const topStudents = await User.findAll({
        where: { class_id: user.class_id },
        order: [['total_points', 'DESC']],
        limit: 10,
    });
    const studentClass = await Class.findOne({ where: { id: user.class_id } });
    let message = `🏆 *${studentClass?.name} sinfi eng yaxshi o'quvchilari* 🏆\n`;
    topStudents.forEach((student, index) => {
        message += `${index + 1}. ${student.full_name} - ${student.total_points} ball\n`;
    });

    ctx.reply(message, studentMenu);
});

// Graceful stop
bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = { bot, notifyStudent };
