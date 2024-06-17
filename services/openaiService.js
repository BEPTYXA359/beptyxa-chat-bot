const axios = require('axios');

const apiUrl = `${process.env.BASE_API_URL}/api/openai`;

const incrementTokensCount = async (userId, inputTokens, outputTokens, usedUSD) => {
    const url = `${apiUrl}/incrementTokensCount/${Number(userId)}/${Number(inputTokens)}/${Number(outputTokens)}/${Number(usedUSD)}`;
    try {
        const response = await axios.put(url);
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при увеличении счетчика токенов: ${error.message}`);
    }
};

module.exports = {
    incrementTokensCount
}