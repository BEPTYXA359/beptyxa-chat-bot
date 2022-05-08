const {Telegraf} = require('telegraf');
require('dotenv').config();
const schedule = require('node-schedule');

const cheerio = require('cheerio');
const needle = require('needle');

const BOT_CONFIG = require("./config");
const bot = new Telegraf(BOT_CONFIG.TOKEN);

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const LocalSession = require('telegraf-session-local');

const localSession = new LocalSession({
    // Database name/path, where sessions will be located (default: 'sessions.json')
    database: 'sessions.json',
    // Name of session property object in Telegraf Context (default: 'session')
    property: 'session',
    // Type of lowdb storage (default: 'storageFileSync')
    storage: LocalSession.storageFileAsync,
    // Format of storage/database (default: JSON.stringify / JSON.parse)
    format: {
        serialize: (obj) => JSON.stringify(obj, null, 2), // null & 2 for pretty-formatted JSON
        deserialize: (str) => JSON.parse(str),
    },
})

// Wait for database async initialization finished (storageFileAsync or your own asynchronous storage adapter)
localSession.DB.then(DB => {
    // Database now initialized, so now you can retrieve anything you want from it
    let sessions = DB.value().sessions;
    sessions.forEach(session => {
        if (session.data?.goodMorningJob?.enabled){
            enableMorningJob(session.data.goodMorningJob.chatId)
        }
    })
    console.log('Current LocalSession DB:', sessions)
    // console.log(DB.get('sessions').getById('1:1').value())
})

bot.use(localSession.middleware())

bot.command('help', (ctx) => {
    ctx.reply(`/enableMorning - Включить доброе утро
/disableMorning - Выключить доброе утро`)
})

bot.command('status', (ctx) => {
    console.log(ctx.session?.goodMorningJob?.enabled)
})

bot.command('enableMorning', async (ctx) => {
    ctx.reply('Влючаю доброе утро)')
    ctx.session.goodMorningJob = {
        enabled: true,
        chatId: ctx.chat.id
    };
    enableMorningJob(ctx.chat.id);
})
bot.command('disableMorning', (ctx) => {
    ctx.session.goodMorningJob = null;
    ctx.reply('Ладно, больше не буду(')
})

// Start webhook via launch method (preferred)
bot.launch({
    webhook: {
        domain: BOT_CONFIG.WH_ADDRESS,
        port: process.env.PORT || BOT_CONFIG.WH_PORT
    }
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