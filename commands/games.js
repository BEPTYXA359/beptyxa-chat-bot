const bot = require("../bot");
const {Markup} = require("telegraf");

const gameShortName = 'trex'
const gameUrl = 'https://beptyxa-bot-games.herokuapp.com/trex/'
const markup = Markup.inlineKeyboard([
    Markup.button.game('🎮 Play now!'),
])

bot.command('game_trex', async (ctx) => {
    console.log(ctx)
    await ctx.replyWithGame(gameShortName, markup)
})

bot.gameQuery((ctx) => ctx.answerGameQuery(gameUrl))