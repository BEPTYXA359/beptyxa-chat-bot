const schedule = require("node-schedule");

require('dotenv').config();
const bot = require('./bot');
const redisClient = require('./redisClient');

require('./commands/service');
require('./commands/games');
require('./commands/tiktok');
const { enableMorningJob } = require('./commands/morning');
const { enableMemeJob } = require('./commands/meme');


// Start webhook via launch method (preferred)
bot.launch({
    // webhook: {
    //     domain: BOT_CONFIG.WH_ADDRESS,
    //     port: process.env.PORT || BOT_CONFIG.WH_PORT
    // }
}).then(async ()=>{
    console.log("started")
    const goodMorningChatId = JSON.parse(await redisClient.get("goodMorningChatId")) || [];
    const memChatId = JSON.parse(await redisClient.get("memChatId")) || [];
    goodMorningChatId.forEach(chatId => {
        enableMorningJob(chatId);
    })
    memChatId.forEach(chatId => {
        enableMemeJob(chatId);
    })
    console.log("Good Morning Id: ", goodMorningChatId);
    console.log("Memes Id: ", memChatId);
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