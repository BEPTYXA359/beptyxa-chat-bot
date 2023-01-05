const bot = require('../bot');
const redisClient = require('../redisClient');
const schedule = require("node-schedule");
const needle = require("needle");
const cheerio = require("cheerio");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

let morningAlreadyEnabled = [];

bot.command('enable_morning', async (ctx) => {
    ctx.reply('Влючаю гудморниг)')
    let goodMorningChatId = JSON.parse(await redisClient.get("goodMorningChatId")) || [];
    if (!goodMorningChatId.includes(ctx.chat.id)){
        goodMorningChatId.push(ctx.chat.id);
    }
    redisClient.set("goodMorningChatId",  JSON.stringify(goodMorningChatId));
    enableMorningJob(ctx.chat.id);
})
bot.command('disable_morning', async (ctx) => {
    let goodMorningChatId = JSON.parse(await redisClient.get("goodMorningChatId")) || [];
    if (goodMorningChatId.includes(ctx.chat.id)){
        goodMorningChatId.splice(goodMorningChatId.indexOf(ctx.chat.id), 1);
    }
    await redisClient.set("goodMorningChatId", JSON.stringify(goodMorningChatId));
    ctx.reply('Ладно, больше не буду гудмонинговать(')
})

const enableMorningJob = function (chatId){
    if (morningAlreadyEnabled.includes(chatId)) return;
    morningAlreadyEnabled.push(chatId);

    const goodMorningJob = schedule.scheduleJob({hour:10, minute:0, tz: "Europe/Moscow"}, async () => {
        console.log('good morning')
        let morning = {};
        do {
            try {
                const response = await needle('get', 'https://otkrytki-besplatno.ru/');
                const $ = cheerio.load(response.body);
                morning.text = $('.nsp_arts.bottom img[alt*="утр"]').attr('alt');
                morning.image = 'http://otkrytki-besplatno.ru' + $('.nsp_arts.bottom img[alt*="утр"]').attr('src');
            } catch (error) {
                morning.error = `Что то не так с открыткой: ${error}`;
                await bot.telegram.sendMessage(chatId, `Что то не так с открыткой: ${error}`);
            }
        } while (morning.text === undefined || morning.error !== undefined)
        const image = await fetch(morning.image);
        const buffer = await image.buffer();
        await bot.telegram.sendAnimation(chatId,morning.image, {caption: morning.text});
        console.log(morning)
    });
}

module.exports.enableMorningJob = enableMorningJob;
