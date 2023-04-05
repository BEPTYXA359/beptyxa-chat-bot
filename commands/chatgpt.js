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

bot.hears(/^э\sбля\s(.*)/i, async ctx => {
    console.log(ctx.message.text)
    const res = await gptApi.sendMessage("Ответь как агрессивный гопник:", ctx.message.text)
    console.log(res);
    ctx.reply(res.text)
})

module.exports = {
    connectChatGPT: connectChatGPT
};