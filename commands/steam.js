const bot = require("../bot");
const REGEXP_LINK = /https:\/\/store\.steampowered\.com\/app\/(\d+)\/([A-Za-z0-9_]+)\//i;
const axios = require('axios');
const fx = require('money');
const schedule = require("node-schedule");

let steam = null;

async function connectSteam() {
    const SteamAPI = await import("steamapi")
    steam = new SteamAPI.default(process.env.STEAM_API_KEY);
    console.log(fx.base, fx.rates);
    axios
        .get(`https://openexchangerates.org/api/latest.json?app_id=${process.env.EXCHANGE_APP_ID}`)
        .then((res) => {
            console.log(res);
            fx.base = res.data.base;
            fx.rates = res.data.rates;
        })
        .catch((e) => {
            console.log(e)
        })

    const updateCurrencyJob = schedule.scheduleJob({
        hour: 12,
        minute: 0,
        second: 0,
        tz: "Europe/Moscow"
    }, () => {
        axios
            .get(`https://openexchangerates.org/api/latest.json?app_id=${process.env.EXCHANGE_APP_ID}`)
            .then((res) => {
                console.log(res);
                fx.base = res.data.base;
                fx.rates = res.data.rates;
            })
            .catch((e) => {
                console.log(e)
            })
    })
}

bot.hears(REGEXP_LINK, async (ctx) => {
    if (fx.rates === {}) return;
    try {
        const gameMatches = ctx.message.text.match(REGEXP_LINK);
        const gameDetails = await steam.getGameDetails(gameMatches[1], {
            language: "russian",
            currency: "kz",
            filters: ["price_overview"]
        });
        console.log(gameDetails.price_overview);
        await ctx.reply(
            gameDetails.price_overview ?
                `~${fx(gameDetails.price_overview.final / 100).from("KZT").to("RUB").toFixed(0)} руб.`
                : "Видимо бесплатно",
            {reply_to_message_id : ctx.message.message_id}
        );
    } catch (e) {
        console.log(e);
        await ctx.reply(
            "Какая то тут ошибочка",
            {reply_to_message_id : ctx.message.message_id}
        );
    }

})

module.exports = {
    connectSteam: connectSteam
};