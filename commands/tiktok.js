const bot = require("../bot");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const puppeteer = require("puppeteer");

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
            bot.telegram.sendChatAction(ctx.chat.id, 'record_video');
            await getTikTokVideoLinkWithPuppeteer(tikTokLink);
            const videoLink = await getTikTokVideoLinkWithPuppeteer(tikTokLink);
            console.log('download link', videoLink)
            const video = await fetch(videoLink.video.url);
            const buffer = await video.buffer();

            //send video to chat
            bot.telegram.sendChatAction(ctx.chat.id, 'upload_video');
            await ctx.replyWithVideo({source: buffer}, {
                caption:
                    `-> ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}\n${videoLink.description}`
            })

            //delete video url
            ctx.deleteMessage(ctx.message.id);
        } catch (error) {
            console.log(`<- to ${ctx.message.from.first_name || ''} ${ctx.message.from.last_name || ''}: TikTok Video Failed - ${error}`)
            ctx.reply(`ERROR TikTok: ${error}`)
        }
    }
}

const getTikTokVideoLinkWithPuppeteer = async (link) => {
    console.log("Starting browser");
    const browser = await (await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })).createIncognitoBrowserContext();
    console.log("Browser started");
    const page = await browser.newPage();
    const tiktokPage = await page.goto(link);
    console.log("TikTok link loaded");

    if (tiktokPage == null) {
        throw new Error("Could not load the desired Page!");
    }

    const html = await tiktokPage.text();

    const cookies = await page.cookies();
    console.log(cookies);
    await browser.close();

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

    console.log("VideoObject", videoObject.ItemModule[id]);
    return {
        cookies,
        video: {
            url: videoURL,
            description: videoDescription
        }
    }
}