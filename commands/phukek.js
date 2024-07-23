const bot = require("../bot");

const schedule = require("node-schedule");
const needle = require("needle");

let phukekJobs = {};

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

        if (phukekJobs.hasOwnProperty(ctx.chat.id) && phukekJobs[ctx.chat.id] !== null){
            phukekJobs[ctx.chat.id].cancel();
            phukekJobs[ctx.chat.id] = null;
        }

    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с выключением пхукека у ${ctx.chat.id}: ${error}`);
    }
})
bot.hears(/пхукек/i, async (ctx) => {
    try {
        console.log(ctx.message.from);
        await sendPhukekImage(ctx.chat.id);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с пхукеком у ${ctx.chat.id}: ${error}`);
    }
})
const enablPhukekJob = function (chatId) {
    if (phukekJobs.hasOwnProperty(chatId) || phukekJobs[chatId] === null) return;
    phukekJobs[chatId] = schedule.scheduleJob('0 * * * *', async () => {
        await sendPhukekImage(chatId);
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