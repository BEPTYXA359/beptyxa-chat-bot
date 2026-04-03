const bot = require("../bot");
const morningService = require("../services/morningService");
const memService = require("../services/memeService");

const COMMANDS = {
    HELP: 'help',
    STATUS: 'status'
};

bot.command(COMMANDS.HELP, (ctx) => {
    ctx.reply(`/tiktok + ссылка - Получить ТикТок видео по ссылке
/status - Узнать статус 
/enable_morning - Включить случайную открытку утром
/disable_morning - Выключить случайную открытку утром
/enable_mem - Включить случайный мем в случайное время
/disable_mem - Выключить случайный мем в случайное время
мем - прислать случайный мем`);
});

bot.command(COMMANDS.STATUS, async (ctx) => {
    try {
        const [goodMorningChatIds, memChatIds] = await Promise.all([
            morningService.getAllEnabledUserIds(),
            memService.getAllEnabledUserIds()
        ]);

        const isMorningEnabled = goodMorningChatIds.includes(ctx.chat.id);
        const isMemEnabled = memChatIds.includes(ctx.chat.id);

        console.log(`Morning Status: ${isMorningEnabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`Mem Status: ${isMemEnabled ? 'ENABLED' : 'DISABLED'}`);

        const replyText = [
            isMorningEnabled ? "Морнинг енаблед)" : "Морнинг дисаблед)",
            isMemEnabled ? "Мемесы енаблед)" : "Мемесы дисаблед)"
        ].join('\n');

        await ctx.reply(replyText);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема со статусом у ${ctx.chat.id}: ${error}`);
    }
});