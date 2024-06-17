const bot = require('../bot');
let store = require('store');
const { GPTTokens } = require ('gpt-tokens');
const openaiService = require("../services/openaiService");
let openai = null;

async function connectOpenAI() {
    const {OpenAI} = await import("openai")
    openai = new OpenAI();
}

bot.hears(/^чатгпт(.*)/i, async ctx => {
    console.log("OpenAI Ответь:" + ctx.message.text)
    try {
        let usageMessages = [];
        bot.telegram.sendChatAction(ctx.chat.id, 'typing');
        let history = store.get(ctx.chat.id) || [];
        const inputMessage = {role: 'user', content: ctx.message.text.toLowerCase().replace("чатгпт", "")};
        history.push( inputMessage );
        usageMessages.push( inputMessage );
        const usageInputInfo = new GPTTokens({
            model: process.env.CHAT_MODEL,
            messages: [ inputMessage ]
        })
        const chatCompletion = await openai.chat.completions.create({
            messages: history,
            model: process.env.CHAT_MODEL,
        });
        const outputMessage = {role: 'assistant', content: chatCompletion.choices[0].message.content};
        history.push( outputMessage );
        usageMessages.push( outputMessage );
        const usageOutputInfo = new GPTTokens({
            model: process.env.CHAT_MODEL,
            messages: [ outputMessage ]
        })
        const usageInfo = new GPTTokens({
            model: process.env.CHAT_MODEL,
            messages: usageMessages
        })

        console.info('Used tokens input: ', usageInputInfo.usedTokens);
        console.info('Used tokens output: ', usageOutputInfo.usedTokens);
        console.info('Used USD: ', usageInfo.usedUSD)

        if (history.length > 10) {
            history.shift();
        }
        store.set(ctx.chat.id, history);
        await ctx.replyWithMarkdown(chatCompletion.choices[0].message.content, {reply_to_message_id : ctx.message.message_id});
        await openaiService.incrementTokensCount(ctx.chat.id, usageInputInfo.usedTokens, usageOutputInfo.usedTokens, usageInfo.usedUSD);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Что то не так с openai у ${ctx.chat.id}: ${error}`);
    }
})

bot.hears(/^(?!\/|мем$).*/i, async ctx => {
    try {
        console.log("Chatterbox:" + ctx.message.text)
        let history = store.get(`chatterbox${ctx.chat.id}`) || [];
        history.push(
            {role: 'user', content: ctx.message.text}
        )
        if (history.length > 10) {
            history.shift();
        }
        store.set(`chatterbox${ctx.chat.id}`, history);
        if (Math.random() * 100 > 1) return;
        bot.telegram.sendChatAction(ctx.chat.id, 'typing');
        const chatCompletion = await openai.chat.completions.create({
            messages: [
                {role: 'system', content: process.env.OPENAI_CHATTERBOX_SYSTEM_TEXT},
                ...history
            ],
            model: 'gpt-3.5-turbo',
        });
        await ctx.reply(chatCompletion.choices[0].message.content,  {reply_to_message_id : ctx.message.message_id});
        history.push(
            {role: 'assistant', content: chatCompletion.choices[0].message.content}
        )
        store.set(`chatterbox${ctx.chat.id}`, history);
    } catch (error) {
        await bot.telegram.sendMessage(process.env.ADMIN_ID, `Что то не так с chatterbox у ${ctx.chat.id}: ${error}`);
    }
})

module.exports = {
    connectOpenAI: connectOpenAI
};