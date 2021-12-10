module.exports = {
    TOKEN: process.env.TG_BOT_TOKEN,
    WH_ADDRESS: process.env.WH_ADDRESS,
    WH_PORT: process.env.WH_PORT,
    HEADERS: {
        follow_max: 10,
        follow_set_cookies: true,
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36",
            Referer: "https://www.tiktok.com/",
            Origin: "https://www.tiktok.com",
        },
        cookies: {
            tt_webid_v2: '689854141086886123'
        }
    }
};