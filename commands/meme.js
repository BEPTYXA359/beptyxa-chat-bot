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
    if (!memChatId.includes(ctx.chat.id)){
        memChatId.push(ctx.chat.id);
    }
    redisClient.set("memChatId",  JSON.stringify(memChatId));
    enableMemeJob(ctx.chat.id);
})
bot.command('disable_mem', async (ctx) => {
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
            const emoji = Math.random() * 100 > 70 ? phrases.emoji[Math.floor(Math.random() * phrases.emoji.length)] : '';
            await ctx.replyWithPhoto({source: buffer}, {caption: `${phrases.mem[Math.floor(Math.random() * phrases.mem.length)]} ${emoji}`});
        } catch (error) {
            await ctx.reply(`Что то не так с мемом: ${error}`);
        }
    }
})
const enableMemeJob = function (chatId){
    if (memeAlreadyEnabled.includes(chatId)) return;
    memeAlreadyEnabled.push(chatId);

    const memeJob = schedule.scheduleJob({hour:Math.floor(Math.random() * 24), minute:Math.floor(Math.random() * 60), tz: "Europe/Moscow"}, async () => {
        let mem;
        try {
            const response = await needle('get', 'https://www.anekdot.ru/random/mem/');
            const $ = cheerio.load(response.body);
            mem = $('.topicbox img').attr('src');
            const image = await fetch(mem);
            const buffer = await image.buffer();
            const emoji = Math.random() * 100 > 70 ? phrases.emoji[Math.floor(Math.random() * phrases.emoji.length)] : '';
            await bot.telegram.sendPhoto(chatId, {source: buffer}, {caption: `${phrases.randomTimeMem[Math.floor(Math.random() * phrases.randomTimeMem.length)]} ${emoji}`});
        } catch (error) {
            await bot.telegram.sendMessage(chatId,`Что то не так с мемом: ${error}`);
        }

        memeAlreadyEnabled.splice(memeAlreadyEnabled.indexOf(chatId), 1)
        memeJob.cancel();
        enableMemeJob(chatId);
    });
}

module.exports.enableMemeJob = enableMemeJob;