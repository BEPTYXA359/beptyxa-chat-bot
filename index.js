const {Telegraf} = require('telegraf');
const TikTokScraper = require('tiktok-scraper');
require('dotenv').config();
const BOT_CONFIG = require("./config");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const bot = new Telegraf(BOT_CONFIG.TOKEN);

const MAX_ATTEMPTS = 3;
const REGEXP_HASHTAG = /#\S+/g;
const REGEXP_LINK = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/i;

bot.hears(REGEXP_LINK, async (ctx) => {

    console.log(`-> from ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}: ${ctx.message.text}`)

    if (ctx.message.text.toLowerCase().includes('tiktok.com')) {
        await bot.telegram.sendChatAction(ctx.chat.id, 'record_video');

        //attempt loop
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            try {
                //Load video data
                const videoMeta = await TikTokScraper.getVideoMeta(ctx.message.text, BOT_CONFIG.HEADERS);
                const video = await fetch(videoMeta.collector[0].videoUrl, BOT_CONFIG.HEADERS);
                const buffer = await video.buffer();

                console.log(`<- to ${ctx.message.from.first_name} ${ctx.message.from.last_name}: TikTok Video Success`)
                //send video to chat
                await bot.telegram.sendChatAction(ctx.chat.id, 'record_video');
                await ctx.replyWithVideo({source: buffer},
                    {
                        caption:
                            `-> ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}\n${videoMeta.collector[0].text.replace(REGEXP_HASHTAG, '')}`
                    })

                attempt = MAX_ATTEMPTS;

                //delete video url
                ctx.deleteMessage(ctx.message.id);

            } catch (error) {
                //if last attempt send error
                if (attempt === MAX_ATTEMPTS - 1) {
                    console.log(`<- to ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}: TikTok Video Failed - ${error}`)
                    ctx.reply(`ERROR TikTok: ${error}`)
                }
            }
        }

    }
})

// Start webhook via launch method (preferred)
bot.launch({
    webhook: {
        domain: BOT_CONFIG.WH_ADDRESS,
        port: process.env.PORT
    }
})
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))