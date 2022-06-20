const BOT_CONFIG = require("./configs/config");
const {Telegraf} = require("telegraf");
const {telegrafThrottler} = require("telegraf-throttler");
const bot = new Telegraf(BOT_CONFIG.TOKEN);
const throttler = telegrafThrottler();
bot.use(throttler);

module.exports = bot;