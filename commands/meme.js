const userService = require('../services/userService');
const memService = require('../services/memeService');

const phrases = require("../configs/phrases.json");
const bot = require("../bot");

const schedule = require("node-schedule");
const needle = require("needle");
const cheerio = require("cheerio");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

let memeAlreadyEnabled = [];

bot.command('enable_mem', async (ctx) => {
    try {
        ctx.reply('Влючаю мемификатор)')
        enableMemeJob(ctx.chat.id);

        //upsert user
        await userService.addUser(ctx.chat.id === ctx.message.from.id ? ctx.message.from : ctx.chat);
        //enable mem
        await memService.enableMem(ctx.chat.id);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с включением мема у ${ctx.chat.id}: ${error}`);
    }
})
bot.command('disable_mem', async (ctx) => {
    try {
        ctx.reply('Ладно, больше не буду мемничать(')

        //upsert user
        await userService.addUser(ctx.chat.id === ctx.message.from.id ? ctx.message.from : ctx.chat);
        //disable mem
        await memService.disableMem(ctx.chat.id);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с выключением мема у ${ctx.chat.id}: ${error}`);
    }
})
bot.hears(/мем/i, async (ctx) => {
    try {
        //случайная картинка в стиле "мем"
        console.log(ctx.message.from);
        await sendMeme(ctx.chat.id, false);

        //upsert user
        await userService.addUser(ctx.chat.id === ctx.message.from.id ? ctx.message.from : ctx.chat);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с мемом у ${ctx.chat.id}: ${error}`);
    }
})
const enableMemeJob = function (chatId) {
    if (memeAlreadyEnabled.includes(chatId)) return;
    memeAlreadyEnabled.push(chatId);

    const memeJob = schedule.scheduleJob({
        hour: Math.floor(Math.random() * 24),
        minute: Math.floor(Math.random() * 60),
        tz: "Europe/Moscow"
    }, async () => {
        await sendMeme(chatId);

        memeAlreadyEnabled.splice(memeAlreadyEnabled.indexOf(chatId), 1)
        memeJob.cancel();
        enableMemeJob(chatId);
    });
}

const sendMeme = async (chatId, isRandom = true) => {
    let mem;
    try {
        const response = await needle('get', 'https://www.anekdot.ru/random/mem/');
        const $ = cheerio.load(response.body);
        mem = $('.topicbox img, .topicbox video source').attr('src');
        const emoji = Math.random() * 100 > 60 ? phrases.emoji[Math.floor(Math.random() * phrases.emoji.length)] : '';

        if (mem.endsWith(".gif")) {
            await bot.telegram.sendAnimation(chatId, mem, {caption: `${phrases.mem[Math.floor(Math.random() * phrases.mem.length)]} ${emoji}`});
        } else if (mem.endsWith(".mp4")) {
            const video = await fetch(mem);
            const buffer = await video.buffer();
            await bot.telegram.sendVideo(chatId, {source: buffer}, {caption: `${phrases.mem[Math.floor(Math.random() * phrases.mem.length)]} ${emoji}`})
        } else {
            await bot.telegram.sendPhoto(chatId, mem, {caption: `${phrases.mem[Math.floor(Math.random() * phrases.mem.length)]} ${emoji}`});
        }
        if (isRandom) {
            await memService.incrementRandomMemCount(chatId);
        } else {
            await memService.incrementMemCount(chatId)
        }
    } catch (error) {
        try {
            await bot.telegram.sendMessage(process.env.ADMIN_ID, `Что то не так с мемом у ${chatId}: ${error}`);

            if (isRandom) {
                await memService.incrementRandomMemErrorCount(chatId);
            } else {
                await memService.incrementMemErrorCount(chatId)
            }
        } catch (error) {
            await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема с ошибкой мема у ${chatId}: ${error}`);
        }
    }
}

module.exports.enableMemeJob = enableMemeJob;