const { Telegraf } = require('telegraf');
const TikTokScraper = require('tiktok-scraper');
const BOT_CONFIG = require( "./config");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const bot = new Telegraf(BOT_CONFIG.TOKEN);


bot.on('text', (ctx) => {

    console.log(`-> from ${ctx.message.from.first_name} ${ctx.message.from.last_name}: ${ctx.message.text}`)

    if (ctx.message.text.includes('tiktok.com')){
        bot.telegram.sendChatAction(ctx.chat.id, 'upload_video');
        TikTokScraper.getVideoMeta(ctx.message.text, BOT_CONFIG.HEADERS)
            .then(data =>{
                fetch(data.collector[0].videoUrl, BOT_CONFIG.HEADERS)
                    .then(res => res.buffer())
                    .then(buffer => {
                        console.log(`<- to ${ctx.message.from.first_name} ${ctx.message.from.last_name}: TikTok Video Success`)
                        ctx.replyWithVideo({source: buffer}, { caption: data.collector[0].text })
                    })

            })
            .catch(error => {
                console.log(`<- to ${ctx.message.from.first_name} ${ctx.message.from.last_name}: TikTok Video Failed - ${error}`)
                ctx.reply(`ERROR TikTok: ${error}`)
            })
    }
})

bot.launch();