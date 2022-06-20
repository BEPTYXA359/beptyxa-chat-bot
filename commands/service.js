const bot = require("../bot");
const redisClient = require("../redisClient");

bot.command('help', (ctx) => {
    ctx.reply(`/enable_morning - Включить доброе утро
/disable_morning - Выключить доброе утро
/enable_mem - Включить случайный мем
/disable_mem - Выключить случайный мем`)
})

bot.command('status', async (ctx) => {
    let goodMorningChatId = JSON.parse(await redisClient.get("goodMorningChatId")) || [];
    let memChatId = JSON.parse(await redisClient.get("memChatId")) || [];
    let replyText = "";

    if (goodMorningChatId.includes(ctx.chat.id)){
        console.log("Morning Status: ENABLED")
        replyText+="Морнинг енаблед)\n"
    } else {
        console.log("Morning Status: DISABLED")
        replyText+="Морнинг дисаблед)\n"
    }

    if (memChatId.includes(ctx.chat.id)){
        console.log("Mem Status: ENABLED")
        replyText+="Мемесы енаблед)\n"
    } else {
        console.log("Mem Status: DISABLED")
        replyText+="Мемесы дисаблед)\n"

    }
    ctx.reply(replyText)
})