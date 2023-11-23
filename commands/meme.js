const phrases = require("../configs/phrases.json");
const bot = require("../bot");
const redisClient = require("../redisClient");
const schedule = require("node-schedule");
const needle = require("needle");
const cheerio = require("cheerio");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

let memeAlreadyEnabled = [];

bot.command('enable_mem', async (ctx) => {
    ctx.reply('Влючаю мемификатор)')
    let memChatId = JSON.parse(await redisClient.get("memChatId")) || [];
    if (!memChatId.includes(ctx.chat.id)) {
        memChatId.push(ctx.chat.id);
    }
    redisClient.set("memChatId", JSON.stringify(memChatId));
    enableMemeJob(ctx.chat.id);
})
bot.command('disable_mem', async (ctx) => {
    let memChatId = JSON.parse(await redisClient.get("memChatId")) || [];
    if (memChatId.includes(ctx.chat.id)) {
        memChatId.splice(memChatId.indexOf(ctx.chat.id), 1);
    }
    await redisClient.set("memChatId", JSON.stringify(memChatId));
    ctx.reply('Ладно, больше не буду мемничать(')
})
bot.hears(/мем/i, async (ctx) => {
    //случайная картинка в стиле "мем"
    console.log(ctx);
    await sendMeme(ctx.chat.id);
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

const sendMeme = async (chatId) => {
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
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Что то не так с мемом у ${chatId}: ${error}`);
    }
}

module.exports.enableMemeJob = enableMemeJob;