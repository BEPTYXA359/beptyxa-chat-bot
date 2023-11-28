const userService = require("../services/userService");
const morningService = require("../services/morningService");

const bot = require('../bot');

const schedule = require("node-schedule");
const needle = require("needle");
const cheerio = require("cheerio");

let morningAlreadyEnabled = [];

const MAX_ATTEMPTS = 5;

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
        if (morningAlreadyEnabled.includes(ctx.chat.id)) {
            morningAlreadyEnabled.splice(morningAlreadyEnabled.indexOf(ctx.chat.id), 1);
        }
        //upsert user
        await userService.addUser(ctx.chat.id === ctx.message.from.id ? ctx.message.from : ctx.chat);
        //enable mem
        await morningService.disableMorning(ctx.chat.id);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с выключением открытки у ${ctx.chat.id}: ${error}`);
    }
})

const enableMorningJob = function (chatId) {
    if (morningAlreadyEnabled.includes(chatId)) return;
    morningAlreadyEnabled.push(chatId);

    console.log("morning enabled for", chatId);

    const goodMorningJob = schedule.scheduleJob({
        hour: 1,
        minute: 56,
        tz: "Europe/Moscow"
    }, async () => {
        console.log('good morning');
        if ( !morningAlreadyEnabled.includes(chatId) ) {
            goodMorningJob.cancel();
            return;
        }
        let morning = {};
        let currentAttempt = 0;
        do {
            try {
                console.log("Попытка №", currentAttempt);
                currentAttempt ++;
                const response = await needle('get', 'https://otkrytki-besplatno.ru/', {rejectUnauthorized: false});
                const $ = cheerio.load(response.body);
                morning.text = $('.nsp_arts.bottom img[alt*="утр"]').attr('alt');
                morning.image = 'http://otkrytki-besplatno.ru' + $('.nsp_arts.bottom img[alt*="утр"]').attr('src');
                console.log(morning)
            } catch (error) {
                try {
                    morning.error = `Что то не так с получением открытки: ${error}`;
                    await bot.telegram.sendMessage(process.env.ADMIN_ID, `Что то не так с получением открытки у ${chatId}: ${error}`);
                    await morningService.incrementMorningErrorCount(chatId);
                } catch (error) {
                    await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с ошибкой открытки у ${chatId}: ${error}`);
                }
            }
        } while (!morning.text || morning.error || MAX_ATTEMPTS === currentAttempt);

        if (morning.image && morning.text) {
            try {
                await bot.telegram.sendAnimation(chatId, morning.image, {caption: morning.text});
                await morningService.incrementMorningCount(chatId);
            } catch (error) {
                try {
                    await bot.telegram.sendMessage(process.env.ADMIN_ID, `Что то не так с отправкой открытки у ${chatId}: ${error}`);
                    await morningService.incrementMorningErrorCount(chatId);
                } catch (error) {
                    await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с ошибкой открытки у ${chatId}: ${error}`);
                }
            }
        } else {
            await bot.telegram.sendMessage(process.env.ADMIN_ID, `Открытку не получил ${chatId}`);
        }
    });
}

module.exports.enableMorningJob = enableMorningJob;
