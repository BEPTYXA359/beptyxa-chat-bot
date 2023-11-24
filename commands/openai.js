const bot = require('../bot');
let store = require('store');
let openai = null;

async function connectOpenAI() {
    const {OpenAI} = await import("openai")
    openai = new OpenAI();
}

bot.hears(/^чатгпт(.*)/i, async ctx => {
    console.log("OpenAI Ответь:" + ctx.message.text)
    try {
        bot.telegram.sendChatAction(ctx.chat.id, 'typing');
        let history = store.get(ctx.chat.id) || [];
        history.push(
            {role: 'user', content: ctx.message.text.toLowerCase().replace("чатгпт", "")}
        )
        const chatCompletion = await openai.chat.completions.create({
            messages: history,
            model: 'gpt-4-1106-preview',
        });
        history.push(
            {role: 'assistant', content: chatCompletion.choices[0].message.content}
        )
        if (history.length > 10) {
            history.shift();
        }
        store.set(ctx.chat.id, history);
        await ctx.reply(chatCompletion.choices[0].message.content);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Что то не так с openai у ${ctx.chat.id}: ${error}`);
    }
})

bot.hears(/^(?!\/|мем$).*/i, async ctx => {
    try {
        console.log("Chatterbox:" + ctx.message.text)
        if (Math.random() * 100 > 5) return;
        bot.telegram.sendChatAction(ctx.chat.id, 'typing');
        const chatCompletion = await openai.chat.completions.create({
            messages: [
                {role: 'system', content: process.env.OPENAI_CHATTERBOX_SYSTEM_TEXT},
                {role: 'user', content: ctx.message.text}
            ],
            model: 'gpt-3.5-turbo',
        });
        await ctx.reply(chatCompletion.choices[0].message.content);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Что то не так с chatterbox у ${ctx.chat.id}: ${error}`);
    }
})

module.exports = {
    connectOpenAI: connectOpenAI
};