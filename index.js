const {Telegraf} = require('telegraf');
require('dotenv').config();
const schedule = require('node-schedule');

const cheerio = require('cheerio');
const needle = require('needle');

const BOT_CONFIG = require("./config");
const bot = new Telegraf(BOT_CONFIG.TOKEN);

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

let goodMorningJob;

bot.command('help', (ctx) => {
    ctx.reply(`/enableMorning - Включить доброе утро
/disableMorning - Выключить доброе утро`)
})

bot.command('enableMorning', async (ctx) => {
    ctx.reply('Влючаю доброе утро)')
    goodMorningJob = schedule.scheduleJob({ hour:10 }, async ()=> {
        let morning = {};
        do {
            try {
                const response = await needle('get', 'https://otkrytki-besplatno.ru/');
                const $ = cheerio.load(response.body);
                morning.text = $('.nsp_arts.bottom img[alt*="утр"]').attr('alt');
                morning.image = 'https://otkrytki-besplatno.ru' + $('.nsp_arts.bottom img[alt*="утр"]').attr('src');
            } catch (error) {
                morning.error = `Что то не так с открыткой: ${error}`;
                ctx.reply('Что то не так с открыткой: ', error);
            }
        } while (morning.text === undefined || morning.error !== undefined)
        const image = await fetch(morning.image);
        const buffer = await image.buffer();
        await ctx.replyWithAnimation({source: buffer},{ caption: morning.text });
        console.log(morning)
    })
})
bot.command('disableMorning', (ctx) => {
    goodMorningJob.cancel();
    ctx.reply('Ладно, больше не буду(')
})

// Start webhook via launch method (preferred)
bot.launch({
    webhook: {
        domain: BOT_CONFIG.WH_ADDRESS,
        port: process.env.PORT || BOT_CONFIG.WH_PORT
    }
})

// Enable graceful stop
process.once('SIGINT', () => {
    schedule.gracefulShutdown();
    bot.stop('SIGINT');
})
process.once('SIGTERM', () => {
    schedule.gracefulShutdown();
    bot.stop('SIGTERM');
})