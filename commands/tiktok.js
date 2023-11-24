const fs = require("fs");
const needle = require("needle");
const bot = require("../bot");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const REGEXP_LINK = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/i;
const MAX_TRY = 5;
bot.hears(REGEXP_LINK, async (ctx) => {
    await sendTikTokVideo(ctx);
})

bot.command('tiktok', async ctx => {
    await sendTikTokVideo(ctx);
})

const sendTikTokVideo = async (ctx) => {
    let currentTry = 0;
    let filePath = null;
    console.log(`-> from ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}: ${ctx.message.text}`)
    const tikTokLink = ctx.message.text.replace('/tiktok', '').replaceAll(' ', '');
    if (tikTokLink.toLowerCase().includes('tiktok.com') && REGEXP_LINK.test(tikTokLink)) {
        try {
            bot.telegram.sendChatAction(ctx.chat.id, 'record_video');
            let videoInfo = null;
            do {
                videoInfo = await getTikTokVideoLinkWithNeedle(tikTokLink);
                filePath = `tiktok-${videoInfo.id}.mp4`;
                console.log('download link', videoInfo)
                await downloadFile(videoInfo.video.url, filePath);
                currentTry++;
                console.log('file size',getFilesizeInMegabytes(filePath))
            } while (getFilesizeInMegabytes(filePath) < 0.1 && currentTry < MAX_TRY)

            if (getFilesizeInMegabytes(filePath) < 0.1){
                throw new Error(`Чот не получилось))`);
            } else {
                //send video to chat
                bot.telegram.sendChatAction(ctx.chat.id, 'upload_video');
                await ctx.replyWithVideo({source: filePath}, {
                    caption:
                        `-> ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}\n${videoInfo.video.description}`
                })

                //delete video url
                ctx.deleteMessage(ctx.message.id);
            }
            fs.unlinkSync(filePath);
        } catch (error) {
            console.log(`<- to ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}: TikTok Video Failed - ${error}`)
            ctx.reply(`ERROR TikTok: ${error}`)
        }
    }
}

const getTikTokVideoLinkWithNeedle = async (link) => {
    const response = await needle('get', link, {follow_max: 20, follow_set_cookies: true, follow_set_referer: true});
    const html = response.body;
    const cookies = response.cookies;

    const endOfJson = html
        .split(`<script id="SIGI_STATE" type="application/json">`)[1]
        .indexOf("</script>");
    const infoObject = html
        .split(`<script id="SIGI_STATE" type="application/json">`)[1]
        .slice(0, endOfJson);
    let videoObject = JSON.parse(infoObject);
    const id = videoObject.ItemList?.video?.list[0] ?? 0;
    if (id === 0) throw new Error(`Could not find the Video on Tiktok!`);
    const videoURL = videoObject.ItemModule[id].video.downloadAddr.trim();
    const videoDescription = videoObject.ItemModule[id].desc;

    return {
        id,
        cookies,
        video: {
            url: videoURL,
            description: videoDescription
        }
    }
}

const downloadFile = async (url, path) => {
    const res = await fetch(url);
    const fileStream = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", resolve);
    });
}

const getFilesizeInMegabytes = (filename) => {
    const stats = fs.statSync(filename);
    const fileSizeInBytes = stats.size;
    return fileSizeInBytes / (1024*1024);
}