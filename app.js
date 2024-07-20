const schedule = require("node-schedule");

require('dotenv').config();
const bot = require('./bot');

require('./commands/service');
require('./commands/games');
//require('./commands/tiktok');
require('./commands/steam');
const groq = require('./commands/groq');
const openAI = require('./commands/openai');
const steam = require('./commands/steam');
groq.connectGroq();
openAI.connectOpenAI();
steam.connectSteam();
const { enableMorningJob } = require('./commands/morning');
const { enableMemeJob } = require('./commands/meme');
const { enablePhukekJob } = require('./commands/phukek');
const memService = require("./services/memeService");
const morningService = require("./services/morningService");


// Start webhook via launch method (preferred)
bot.launch({
    // webhook: {
    //     domain: BOT_CONFIG.WH_ADDRESS,
    //     port: process.env.PORT || BOT_CONFIG.WH_PORT
    // }
}).then(async ()=>{
    try {
        console.log("started")
        const goodMorningChatId = await morningService.getAllEnabledUserIds();
        const memChatId = await memService.getAllEnabledUserIds();
        goodMorningChatId.forEach(chatId => {
            enableMorningJob(chatId);
        })
        memChatId.forEach(chatId => {
            enableMemeJob(chatId);
        })
        console.log("Good Morning Id: ", goodMorningChatId);
        console.log("Memes Id: ", memChatId);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Проблема загрузкой данных по бд: ${error}`);
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