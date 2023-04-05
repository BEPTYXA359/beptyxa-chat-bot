const bot = require('../bot');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

let gptApi = null;

async function connectChatGPT() {
    const { ChatGPTAPI } = await import('chatgpt')

    gptApi = new ChatGPTAPI({
        apiKey: process.env.OPENAI_ACCESS_TOKEN,
        fetch: async (url, options) => {
            return fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    // 'keep-alive': 'timeout=360',
                    accept: 'text/event-stream'
                },
                keepalive: true
            })
        }
    })
}

bot.hears(/^братуха\s(.*)/i, async ctx => {
    console.log("Ответь как гопник на:" + ctx.message.text)
    bot.telegram.sendChatAction(ctx.chat.id, 'typing');
    const res = await gptApi.sendMessage("Ответь как гопник-татарин с маленьким словарным запасом, со словами паразитами и матами на: " + ctx.message.text)
    console.log(res);
    ctx.reply(res.text)
})

bot.hears(/^тяночка\s(.*)/i, async ctx => {
    console.log("Ответь как аниме тян на:" + ctx.message.text)
    bot.telegram.sendChatAction(ctx.chat.id, 'typing');
    const res = await gptApi.sendMessage("Ответь как милая аниме девочка отвечает братику на: " + ctx.message.text)
    console.log(res);
    ctx.reply(res.text)
})

bot.hears(/^храз\s(.*)/i, async ctx => {
    console.log("Ответь как храз на:" + ctx.message.text)
    bot.telegram.sendChatAction(ctx.chat.id, 'typing');
    const res = await gptApi.sendMessage("Ответь уважительно и официально как советский учёный по имени Захаров Харитон Радеонович на: " + ctx.message.text)
    console.log(res, res.choices);
    ctx.reply(res.text)
})

bot.hears(/^ара\s(.*)/i, async ctx => {
    console.log("Ответь как ара на:" + ctx.message.text)
    bot.telegram.sendChatAction(ctx.chat.id, 'typing');
    const res = await gptApi.sendMessage("Ответь как дагестанец с дагестанским акцентом на: " + ctx.message.text)
    console.log(res, res.choices);
    ctx.reply(res.text)
})

module.exports = {
    connectChatGPT: connectChatGPT
};