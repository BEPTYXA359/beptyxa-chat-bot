const bot = require("../bot");
const redisClient = require("../redisClient");

bot.command('help', (ctx) => {
    ctx.reply(`/tiktok + ссылка - Получить ТикТок видео по ссылке
/status - Узнать статус 
/enable_morning - Включить случайную открытку утром
/disable_morning - Выключить случайную открытку утром
/enable_mem - Включить случайный мем в случайное время
/disable_mem - Выключить случайный мем в случайное время
мем - прислать случайный мем
ссылка на тикток видео - Получить ТикТок видео по ссылке`)
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