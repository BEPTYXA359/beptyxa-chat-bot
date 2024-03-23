const bot = require("../bot");
const REGEXP_LINK = /https:\/\/store\.steampowered\.com\/app\/(\d+)\/([A-Za-z0-9_]+)\//i;
//const SteamAPI = require('steamapi');
let steam = null;

async function connectSteam() {
    const SteamAPI = await import("steamapi")
    steam = new SteamAPI.default(process.env.STEAM_API_KEY);
}

bot.hears(REGEXP_LINK, async (ctx) => {
    try {
        const gameMatches = ctx.message.text.match(REGEXP_LINK);
        const gameDetails = await steam.getGameDetails(gameMatches[1], {
            language: "russian",
            currency: "ru",
            filters: ["price_overview"]
        });
        await ctx.reply(
            gameDetails.price_overview ? gameDetails.price_overview.final_formatted : "Видимо бесплатно",
            {reply_to_message_id : ctx.message.message_id}
        );
    } catch (e) {
        await ctx.reply(
            "Какая то тут ошибочка",
            {reply_to_message_id : ctx.message.message_id}
        );
    }

})

module.exports = {
    connectSteam: connectSteam
};