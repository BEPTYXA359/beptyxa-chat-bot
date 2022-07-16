const bot = require("../bot");
const tiktok = require("tiktok-scraper-ts");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const REGEXP_LINK = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/i;

bot.hears(REGEXP_LINK, async (ctx) => {
    await sendTikTokVideo(ctx);
})

bot.command('tiktok', async ctx => {
    await sendTikTokVideo(ctx);
})

const sendTikTokVideo = async (ctx) => {
    console.log(`-> from ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}: ${ctx.message.text}`)
    const tikTokLink = ctx.message.text.replace('/tiktok', '').replaceAll(' ', '');
    if (tikTokLink.toLowerCase().includes('tiktok.com') && REGEXP_LINK.test(tikTokLink)) {
        try {
            await bot.telegram.sendChatAction(ctx.chat.id, 'record_video');
            const videoLink = await tiktok.fetchVideoNoWaterMark(tikTokLink);
            console.log('download link', videoLink)
            const video = await fetch(videoLink);
            const buffer = await video.buffer();

            //send video to chat
            await bot.telegram.sendChatAction(ctx.chat.id, 'upload_video');
            await ctx.replyWithVideo({source: buffer}, {
                caption:
                    `-> ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}\n`
            })

            //delete video url
            ctx.deleteMessage(ctx.message.id);
        } catch (error) {
            console.log(`<- to ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}: TikTok Video Failed - ${error}`)
            ctx.reply(`ERROR TikTok: ${error}`)
        }
    }
}