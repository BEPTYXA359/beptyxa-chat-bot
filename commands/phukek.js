const bot = require("../bot");

const schedule = require("node-schedule");
const needle = require("needle");

let phukekAlreadyEnabled = [];

bot.command('enable_phukek', async (ctx) => {
    try {
        ctx.reply('Влючаю мониторинг пхукека)')
        enablPhukekJob(ctx.chat.id);
        await sendPhukekImage(ctx.chat.id);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с включением пхукека у ${ctx.chat.id}: ${error}`);
    }
})
bot.command('disable_phukek', async (ctx) => {
    try {
        ctx.reply('Ладно, больше не буду пхукекать(')

        if (phukekAlreadyEnabled.includes(ctx.chat.id)) {
            phukekAlreadyEnabled.splice(phukekAlreadyEnabled.indexOf(ctx.chat.id), 1);
        }
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с выключением мема у ${ctx.chat.id}: ${error}`);
    }
})
bot.hears(/пхукек/i, async (ctx) => {
    try {
        console.log(ctx.message.from);
        await sendPhukekImage(ctx.chat.id);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с мемом у ${ctx.chat.id}: ${error}`);
    }
})
const enablPhukekJob = function (chatId) {
    if (phukekAlreadyEnabled.includes(chatId)) return;
    phukekAlreadyEnabled.push(chatId);

    const phukekJob = schedule.scheduleJob({
        hour: (new Date()).getHours() + 1,
        minute: 0,
        tz: "Europe/Moscow"
    }, async () => {
        if (!phukekAlreadyEnabled.includes(chatId)) {
            phukekJob.cancel();
            return;
        }
        await sendPhukekImage(chatId);

        phukekAlreadyEnabled.splice(phukekAlreadyEnabled.indexOf(chatId), 1)
        phukekJob.cancel();
        enablPhukekJob(chatId);
    });
}

const sendPhukekImage = async (chatId) => {
    try {
        const response = await needle('get', 'https://ipcamlive.com/player/snapshot.php?alias=6211dc3352960');
        await bot.telegram.sendPhoto(chatId, response.headers.location);

    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Что то не так с пхукеком у ${chatId}: ${error}`);
    }
}

module.exports.enablePhukekJob = enablPhukekJob;