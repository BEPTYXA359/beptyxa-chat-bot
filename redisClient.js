const Redis = require('ioredis');
const redisURL = process.env.REDIS_URL;

const redisClient = redisURL ? new Redis(redisURL) : new Redis();
redisClient.on("connect", async ()=>{
    console.log("redis connected to", process.env.REDIS_URL)
})

module.exports = redisClient;