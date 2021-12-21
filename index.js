const {Telegraf} = require('telegraf');
const TikTokScraper = require('tiktok-scraper');
require('dotenv').config();
const BOT_CONFIG = require("./config");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const bot = new Telegraf(BOT_CONFIG.TOKEN);

const MAX_ATTEMPTS = 4;
const REGEXP_HASHTAG = /#\S+/g;
const REGEXP_LINK = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/i;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

bot.on('text', async (ctx) => {
    //skip if not a link
    if (!REGEXP_LINK.test(ctx.message.text)) return;

    console.log(`-> from ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}: ${ctx.message.text}`)

    if (ctx.message.text.toLowerCase().includes('tiktok.com')) {
        await bot.telegram.sendChatAction(ctx.chat.id, 'record_video');

        //attempt loop
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            try {
                await delay(attempt * 5000)

                //Load video data
                const videoMeta = await TikTokScraper.getVideoMeta(ctx.message.text, BOT_CONFIG.HEADERS);
                const video = await fetch(videoMeta.collector[0].videoUrl, BOT_CONFIG.HEADERS);
                const buffer = await video.buffer();

                //send video to chat
                await bot.telegram.sendChatAction(ctx.chat.id, 'upload_video');
                await ctx.replyWithVideo({source: buffer},
                    {
                        caption:
                            `-> ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}\n${videoMeta.collector[0].text.replace(REGEXP_HASHTAG, '')}`
                    })

                attempt = MAX_ATTEMPTS;

                //delete video url
                ctx.deleteMessage(ctx.message.id);
                console.log(`<- to ${ctx.message.from.first_name} ${ctx.message.from.last_name}: TikTok Video Success`)
            } catch (error) {
                //if last attempt send error
                if (attempt === MAX_ATTEMPTS - 1) {
                    console.log(`<- to ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}: TikTok Video Failed - ${error}`)
                    await ctx.replyWithPhoto({source: 'images/papichzol.jpeg'}, {caption: `ERROR TikTok: ${error}`});
                } else {
                    switch (attempt){
                        case 0:
                            await ctx.replyWithPhoto({source: 'images/papichsec.jpeg'}, {caption: 'ВОТ СЕЙЧАС НЕ ПОНЯЛ СЕКУНДОЧКУ ПЛЮС МИНУТОЧКУ'});
                            break;
                        case 3:
                            await ctx.replyWithPhoto({source: 'images/papichlast.jpeg'}, {caption: 'ТАК ПОСЛЕДНЯЯ ГАЙС'});
                            break;
                        default:
                            break;
                    }
                }
            }
        }

    }
})

bot.hears('STOP_BOT', (ctx) =>{
    if (ctx.message.from.username === process.env.OWNER_USERNAME){
        console.log('BOT STOPPED')
        bot.stop('SIGTERM')
    }
})

// Start webhook via launch method (preferred)
bot.launch({
    webhook: {
        domain: BOT_CONFIG.WH_ADDRESS,
        port: process.env.PORT || BOT_CONFIG.WH_PORT
    }
})
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))