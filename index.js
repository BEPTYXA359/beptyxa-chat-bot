const {Telegraf} = require('telegraf');
require('dotenv').config();
const schedule = require('node-schedule');

const cheerio = require('cheerio');
const needle = require('needle');

const BOT_CONFIG = require("./config");
const bot = new Telegraf(BOT_CONFIG.TOKEN);

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const redis = require('redis');
const redisURL = process.env.REDIS_URL;

const redisClient = redisURL ? redis.createClient({url: redisURL}) : redis.createClient();
redisClient.connect();

redisClient.on("connect", async ()=>{
    console.log("redis connected")
    let goodMorningChatId = JSON.parse(await redisClient.get("goodMorningChatId")) || [];
    goodMorningChatId.forEach(chatId => {
        enableMorningJob(chatId);
    })
    console.log("Good Morning Id: ", goodMorningChatId);
})

bot.command('help', (ctx) => {
    ctx.reply(`/enableMorning - Включить доброе утро
/disableMorning - Выключить доброе утро`)
})

bot.command('status', async (ctx) => {
    let goodMorningChatId = JSON.parse(await redisClient.get("goodMorningChatId")) || [];
    if (goodMorningChatId.includes(ctx.chat.id)){
        console.log("Morning Status: ENABLED")
        ctx.reply("Морнинг енаблед")
    } else {
        console.log("Morning Status: DISABLED")
        ctx.reply("Морнинг дисаблед")
    }

})

bot.command('enableMorning', async (ctx) => {
    ctx.reply('Влючаю доброе утро)')
    let goodMorningChatId = JSON.parse(await redisClient.get("goodMorningChatId")) || [];
    if (!goodMorningChatId.includes(ctx.chat.id)){
        goodMorningChatId.push(ctx.chat.id);
    }
    redisClient.set("goodMorningChatId",  JSON.stringify(goodMorningChatId));
    enableMorningJob(ctx.chat.id);
})
bot.command('disableMorning', async (ctx) => {
    let goodMorningChatId = JSON.parse(await redisClient.get("goodMorningChatId")) || [];
    if (goodMorningChatId.includes(ctx.chat.id)){
        goodMorningChatId.splice(goodMorningChatId.indexOf(ctx.chat.id), 1);
    }
    await redisClient.set("goodMorningChatId", JSON.stringify(goodMorningChatId));
    ctx.reply('Ладно, больше не буду(')
})

// Start webhook via launch method (preferred)
bot.launch({
    webhook: {
        domain: BOT_CONFIG.WH_ADDRESS,
        port: process.env.PORT || BOT_CONFIG.WH_PORT
    }
}).then(()=>{
    console.log("started")
    console.log()
})

function enableMorningJob(chatId){
    const goodMorningJob = schedule.scheduleJob({minute:0}, async () => {
        let morning = {};
        do {
            try {
                const response = await needle('get', 'https://otkrytki-besplatno.ru/');
                const $ = cheerio.load(response.body);
                morning.text = $('.nsp_arts.bottom img[alt*="утр"]').attr('alt');
                morning.image = 'https://otkrytki-besplatno.ru' + $('.nsp_arts.bottom img[alt*="утр"]').attr('src');
            } catch (error) {
                morning.error = `Что то не так с открыткой: ${error}`;
                await bot.telegram.sendMessage(chatId, `Что то не так с открыткой: ${error}`);
            }
        } while (morning.text === undefined || morning.error !== undefined)
        const image = await fetch(morning.image);
        const buffer = await image.buffer();
        await bot.telegram.sendAnimation(chatId,{source: buffer}, {caption: morning.text});
        console.log(morning)
    });
}


// Enable graceful stop
process.once('SIGINT', () => {
    schedule.gracefulShutdown();
    bot.stop('SIGINT');
})
process.once('SIGTERM', () => {
    schedule.gracefulShutdown();
    bot.stop('SIGTERM');
})