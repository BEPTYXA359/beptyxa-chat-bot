const Redis = require('ioredis');
const redisURL = process.env.REDIS_URL;

const redisClient = redisURL ? new Redis({host: redisURL, connectTimeout: 10000}) : new Redis({connectTimeout: 10000});
redisClient.on("connect", async ()=>{
    console.log("redis connected to", process.env.REDIS_URL)
})

module.exports = redisClient;