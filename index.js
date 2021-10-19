const { Telegraf } = require('telegraf');
const TikTokScraper = require('tiktok-scraper');
const BOT_CONFIG = require( "./config");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const bot = new Telegraf(BOT_CONFIG.TOKEN);

const maxAttempts = 3;

bot.on('text', (ctx) => {

    console.log(`-> from ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}: ${ctx.message.text}`)

    if (ctx.message.text.includes('tiktok.com')){
        bot.telegram.sendChatAction(ctx.chat.id, 'upload_video');

        //attempt loop
        for(let attempt = 0; attempt < maxAttempts; attempt++){

            //Load video data
            TikTokScraper.getVideoMeta(ctx.message.text, BOT_CONFIG.HEADERS)
                .then(data =>{
                    fetch(data.collector[0].videoUrl, BOT_CONFIG.HEADERS)
                        .then(res => res.buffer())
                        .then(buffer => {
                            //end attempt loop
                            attempt = maxAttempts;

                            console.log(`<- to ${ctx.message.from.first_name} ${ctx.message.from.last_name}: TikTok Video Success`)
                            //send video to chat
                            ctx.replyWithVideo({source: buffer}, { caption: data.collector[0].text })
                                .then(()=>{
                                    //delete video url
                                    ctx.deleteMessage(ctx.message.id);
                                })
                        })

                })
                .catch(error => {
                    //if last attempt send error
                    if (attempt === maxAttempts - 1){
                        console.log(`<- to ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}: TikTok Video Failed - ${error}`)
                        ctx.reply(`ERROR TikTok: ${error}`)
                    }

                })
        }

    }
})

bot.launch();