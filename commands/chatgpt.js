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

bot.hears(/^братуха(.*)/i, async ctx => {
    console.log("Ответь как гопник на:" + ctx.message.text)
    bot.telegram.sendChatAction(ctx.chat.id, 'typing');
    const res = await gptApi.sendMessage("Ответь как гопник-татарин с маленьким словарным запасом, со словами паразитами и матами на: " + ctx.message.text)
    console.log(res);
    ctx.reply(res.text)
})

bot.hears(/^тяночка(.*)/i, async ctx => {
    console.log("Ответь как аниме тян на:" + ctx.message.text)
    bot.telegram.sendChatAction(ctx.chat.id, 'typing');
    const res = await gptApi.sendMessage("Ответь как милая аниме девочка отвечает братику на: " + ctx.message.text)
    console.log(res);
    ctx.reply(res.text)
})

bot.hears(/^храз(.*)/i, async ctx => {
    console.log("Ответь как храз на:" + ctx.message.text.toLowerCase().replace("храз", ""))
    bot.telegram.sendChatAction(ctx.chat.id, 'typing');
    const res = await gptApi.sendMessage("Ответь уважительно и официально как советский учёный в области нейробиологии по имени Захаров Харитон Радеонович на: " + ctx.message.text.toLowerCase().replace("храз", ""))
    console.log(res, res.choices);
    ctx.reply(res.text)
})

bot.hears(/^чатгпт(.*)/i, async ctx => {
    console.log("Ответь как gtp на:" + ctx.message.text)
    bot.telegram.sendChatAction(ctx.chat.id, 'typing');
    const res = await gptApi.sendMessage(ctx.message.text.toLowerCase().replace("чатгпт", ""))
    console.log(res, res.detail.choices);
    ctx.reply(res.text)
})

module.exports = {
    connectChatGPT: connectChatGPT
};