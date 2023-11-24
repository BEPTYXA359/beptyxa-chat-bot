const userService = require("../services/userService");
const morningService = require("../services/morningService");

const bot = require('../bot');

const schedule = require("node-schedule");
const needle = require("needle");
const cheerio = require("cheerio");

let morningAlreadyEnabled = [];

bot.command('enable_morning', async (ctx) => {
    try {
        ctx.reply('Влючаю гудморниг)')
        enableMorningJob(ctx.chat.id);

        console.log(ctx);
        console.log(ctx.message.from);
        console.log(ctx.chat);
        //upsert user
        await userService.addUser(ctx.chat.id === ctx.message.from.id ? ctx.message.from : ctx.chat);
        //enable mem
        await morningService.enableMorning(ctx.chat.id);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с включением открытки у ${ctx.chat.id}: ${error}`);
    }
})
bot.command('disable_morning', async (ctx) => {
    try {
        ctx.reply('Ладно, больше не буду гудмонинговать(')
        //upsert user
        await userService.addUser(ctx.chat.id === ctx.message.from.id ? ctx.message.from : ctx.chat);
        //enable mem
        await morningService.disableMorning(ctx.chat.id);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с выключением открытки у ${ctx.chat.id}: ${error}`);
    }
})

const enableMorningJob = function (chatId){
    if (morningAlreadyEnabled.includes(chatId)) return;
    morningAlreadyEnabled.push(chatId);

    const goodMorningJob = schedule.scheduleJob({
        hour: 10,
        minute: 0,
        tz: "Europe/Moscow"
    }, async () => {
        console.log('good morning')
        let morning = {};
        do {
            try {
                const response = await needle('get', 'https://otkrytki-besplatno.ru/', {rejectUnauthorized : false});
                const $ = cheerio.load(response.body);
                morning.text = $('.nsp_arts.bottom img[alt*="утр"]').attr('alt');
                morning.image = 'http://otkrytki-besplatno.ru' + $('.nsp_arts.bottom img[alt*="утр"]').attr('src');

                await bot.telegram.sendAnimation(chatId,morning.image, {caption: morning.text});
                await morningService.incrementMorningCount(chatId);

                console.log(morning)
            } catch (error) {
                try {
                    morning.error = `Что то не так с открыткой: ${error}`;
                    await bot.telegram.sendMessage(process.env.ADMIN_ID, `Что то не так с открыткой у ${chatId}: ${error}`);
                    await morningService.incrementMorningErrorCount(chatId);
                } catch (error) {
                    await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с ошибкой открытки у ${chatId}: ${error}`);
                }

            }
        } while (morning.text === undefined || morning.error !== undefined)
    });
}

module.exports.enableMorningJob = enableMorningJob;
