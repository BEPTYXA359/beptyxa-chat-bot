const {Telegraf} = require('telegraf');
require('dotenv').config();
const schedule = require('node-schedule');

const cheerio = require('cheerio');
const needle = require('needle');

const BOT_CONFIG = require("./config");
const bot = new Telegraf(BOT_CONFIG.TOKEN);

const phrases = require("./phrases.json");

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const Redis = require('ioredis');
const redisURL = process.env.REDIS_URL;

const redisClient = redisURL ? new Redis(redisURL) : new Redis();

let jobState = {
    morningAlreadyEnabled: [],
    memeAlreadyEnabled: []
}

redisClient.on("connect", async ()=>{
    console.log("redis connected to", process.env.REDIS_URL)
})

bot.command('help', (ctx) => {
    ctx.reply(`/enableMorning - Включить доброе утро
/disableMorning - Выключить доброе утро`)
})

bot.command('status', async (ctx) => {
    let goodMorningChatId = JSON.parse(await redisClient.get("goodMorningChatId")) || [];
    let memChatId = JSON.parse(await redisClient.get("memChatId")) || [];

    if (goodMorningChatId.includes(ctx.chat.id)){
        console.log("Morning Status: ENABLED")
        ctx.reply("Морнинг енаблед)")
    } else {
        console.log("Morning Status: DISABLED")
        ctx.reply("Морнинг дисаблед)")
    }

    if (memChatId.includes(ctx.chat.id)){
        console.log("Mem Status: ENABLED")
        ctx.reply("Мемесы енаблед)")
    } else {
        console.log("Mem Status: DISABLED")
        ctx.reply("Мемесы дисаблед)")
    }
})

bot.command('enableMorning', async (ctx) => {
    ctx.reply('Влючаю гудморниг)')
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
    ctx.reply('Ладно, больше не буду гудмонинговать(')
})

bot.command('enableMem', async (ctx) => {
    ctx.reply('Влючаю мемификатор)')
    let memChatId = JSON.parse(await redisClient.get("memChatId")) || [];
    if (!memChatId.includes(ctx.chat.id)){
        memChatId.push(ctx.chat.id);
    }
    redisClient.set("memChatId",  JSON.stringify(memChatId));
    enableMemeJob(ctx.chat.id);
})
bot.command('disableMem', async (ctx) => {
    let memChatId = JSON.parse(await redisClient.get("memChatId")) || [];
    if (memChatId.includes(ctx.chat.id)){
        memChatId.splice(memChatId.indexOf(ctx.chat.id), 1);
    }
    await redisClient.set("memChatId", JSON.stringify(memChatId));
    ctx.reply('Ладно, больше не буду мемничать(')
})

bot.on("text", async (ctx) => {
    //случайная картинка в стиле "мем"
    if (ctx.message.text.toLowerCase() === "мем"){
        let mem;
        try {
            const response = await needle('get', 'https://www.anekdot.ru/random/mem/');
            const $ = cheerio.load(response.body);
            mem = $('.topicbox img').attr('src');
            const image = await fetch(mem);
            const buffer = await image.buffer();
            await ctx.replyWithPhoto({source: buffer}, {caption: phrases.mem[Math.floor(Math.random() * phrases.mem.length)]});
        } catch (error) {
            await ctx.reply(`Что то не так с мемом: ${error}`);
        }
    }
})

// Start webhook via launch method (preferred)
bot.launch({
    // webhook: {
    //     domain: BOT_CONFIG.WH_ADDRESS,
    //     port: process.env.PORT || BOT_CONFIG.WH_PORT
    // }
}).then(async ()=>{
    console.log("started")
    let goodMorningChatId = JSON.parse(await redisClient.get("goodMorningChatId")) || [];
    let memChatId = JSON.parse(await redisClient.get("memChatId")) || [];
    goodMorningChatId.forEach(chatId => {
        enableMorningJob(chatId);
    })
    memChatId.forEach(chatId => {
        enableMemeJob(chatId);
    })
    console.log("Good Morning Id: ", goodMorningChatId);
    console.log("Memes Id: ", memChatId);
})

function enableMorningJob(chatId){
    if (jobState.morningAlreadyEnabled.includes(chatId)) return;
    jobState.morningAlreadyEnabled.push(chatId);

    const goodMorningJob = schedule.scheduleJob({hour:10, minute:0, tz: "Europe/Moscow"}, async () => {
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

function enableMemeJob(chatId){
    if (jobState.memeAlreadyEnabled.includes(chatId)) return;
    jobState.memeAlreadyEnabled.push(chatId);

    const memeJob = schedule.scheduleJob({hour:Math.floor(Math.random() * 24), minute:Math.floor(Math.random() * 60), tz: "Europe/Moscow"}, async () => {
        let mem;
        try {
            const response = await needle('get', 'https://www.anekdot.ru/random/mem/');
            const $ = cheerio.load(response.body);
            mem = $('.topicbox img').attr('src');
            const image = await fetch(mem);
            const buffer = await image.buffer();
            await bot.telegram.sendPhoto(chatId, {source: buffer}, {caption: phrases.randomTimeMem[Math.floor(Math.random() * phrases.randomTimeMem.length)]});
        } catch (error) {
            await bot.telegram.sendMessage(chatId,`Что то не так с мемом: ${error}`);
        }

        jobState.memeAlreadyEnabled.splice(jobState.memeAlreadyEnabled.indexOf(chatId), 1)
        memeJob.cancel();
        enableMemeJob(chatId);
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