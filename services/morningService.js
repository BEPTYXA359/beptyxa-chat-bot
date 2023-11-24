const axios = require('axios');

const apiUrl = `${process.env.BASE_API_URL}/api/mornings`;

const incrementMorningCount = async (userId) => {
    const url = `${apiUrl}/incrementMorningCount/${Number(userId)}`;
    try {
        const response = await axios.put(url);
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при увеличении счетчика morningCount: ${error.message}`);
    }
};

const incrementMorningErrorCount = async (userId) => {
    const url = `${apiUrl}/incrementMorningErrorCount/${Number(userId)}`;
    try {
        const response = await axios.put(url);
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при увеличении счетчика morningErrorCount: ${error.message}`);
    }
};

const enableMorning = async (userId) => {
    const url = `${apiUrl}/enable/${userId}`;
    try {
        const response = await axios.post(url);
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при активации морнинга: ${error.message}`);
    }
};

const disableMorning = async (userId) => {
    const url = `${apiUrl}/disable/${userId}`;
    try {
        const response = await axios.post(url);
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при деактивации морнинга: ${error.message}`);
    }
};

const getAllEnabledUserIds = async () => {
    const url = `${apiUrl}/enabled-user-ids`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при получении всех пользователей морнинга: ${error.message}`);
    }
};

module.exports = {
    incrementMorningCount,
    incrementMorningErrorCount,
    enableMorning,
    disableMorning,
    getAllEnabledUserIds
};