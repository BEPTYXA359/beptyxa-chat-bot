const Groq = require("groq-sdk");
const bot = require('../bot');
let store = require('store');

let groq = null;

async function connectGroq() {
    console.log("ksad")
    groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });
}

bot.hears(/^лама(.*)/i, async ctx => {
    console.log("Лама Ответь:" + ctx.message.text)
    try {
        const historyChatId = `llama_${ctx.chat.id}`;
        bot.telegram.sendChatAction(ctx.chat.id, 'typing');
        let history = store.get(historyChatId) || [];
        history.push(
            {role: 'user', content: ctx.message.text.toLowerCase().replace("лама", "")}
        )
        const chatCompletion = await groq.chat.completions.create({
            messages: history,
            model: "llama3-8b-8192",
        });
        history.push(
            {role: 'assistant', content: chatCompletion.choices[0].message.content}
        )
        if (history.length > 10) {
            history.shift();
        }
        store.set(historyChatId, history);
        await ctx.replyWithMarkdown(chatCompletion.choices[0].message.content, {reply_to_message_id : ctx.message.message_id});
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Что то не так с ламой у ${ctx.chat.id}: ${error}`);
    }
})

module.exports = {
    connectGroq: connectGroq
};