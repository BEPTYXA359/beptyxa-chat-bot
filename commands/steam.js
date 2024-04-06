const bot = require("../bot");
const REGEXP_LINK = /https:\/\/store\.steampowered\.com\/app\/(\d+)\/([A-Za-z0-9_]+)\//i;
const axios = require('axios');
const fx = require('money');
const schedule = require("node-schedule");


async function connectSteam() {
    console.log(fx.base, fx.rates);
    axios
        .get(`https://openexchangerates.org/api/latest.json?app_id=${process.env.EXCHANGE_APP_ID}`)
        .then((res) => {
            //console.log(res);
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
        const gameDetails = await getGameDetails(gameMatches[1]);
        let prices = [];

        if (gameDetails.is_free) {
            prices.push( `_${gameDetails.name.replaceAll('-', '\\-')}_ \\- *Бесплатно*` )
        } else {
            gameDetails.package_groups[0].subs.forEach( (sub) => {
                prices.push( `_${getOptionText(sub.option_text)}_ *\\~ ${getPriceInRub(sub.price_in_cents_with_discount)}*` )
            })
        }
        console.log(prices);
        const dlcPrices = [];
        for (const item in gameDetails.dlc) {
            const dlcData = await getGameDetails(gameDetails.dlc[item]);
            dlcData.package_groups[0].subs.forEach( (sub) => {
                dlcPrices.push( `_${getOptionText(sub.option_text)}_ *\\~ ${getPriceInRub(sub.price_in_cents_with_discount)}*` )
            })
        }
        console.log(dlcPrices);
        const pricesText = prices.join('\n');
        const dlcText = dlcPrices.length > 0 ? `\n\n_DLC:_\n${dlcPrices.join('\n')}` : '';

        await ctx.replyWithMarkdownV2(
            `${pricesText}${dlcText}`,
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

const getGameDetails = async (id) => {
    return (await axios.get("https://store.steampowered.com/api/appdetails", {
        params: {
            cc: 'kz',
            appids: id,
        }
    })).data[id].data;
}

const getPriceInRub = (price) => {
    return `${fx(price / 100).from("KZT").to("RUB").toFixed(0)}₽`
}

const getOptionText = (text) => {
    return text.replaceAll('<span class="discount_original_price">', '~').replaceAll('</span>', '~').replaceAll('-','\\-');
}

module.exports = {
    connectSteam: connectSteam
};