const bot = require('../bot');
let store = require('store');
let openai = null;

async function connectOpenAI() {
    const { OpenAI } = await import("openai")
    openai = new OpenAI();
}

bot.hears(/^чатгпт(.*)/i, async ctx => {
    console.log("OpenAI Ответь:" + ctx.message.text)
    bot.telegram.sendChatAction(ctx.chat.id, 'typing');
    let history = store.get(ctx.chat.id) || [];
    history.push(
        { role: 'user', content: ctx.message.text.toLowerCase().replace("чатгпт", "") }
    )
    const chatCompletion = await openai.chat.completions.create({
        messages: history,
        model: 'gpt-3.5-turbo',
    });
    history.push(
        { role: 'assistant', content: chatCompletion.choices[0].message.content }
    )
    store.set(ctx.chat.id, history);
    await ctx.reply(chatCompletion.choices[0].message.content);
})

module.exports = {
    connectOpenAI: connectOpenAI
};