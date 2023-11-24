const axios = require('axios');

const apiUrl = `${process.env.BASE_API_URL}/api/mems`;

const incrementMemCount = async (userId) => {
    const url = `${apiUrl}/incrementMemCount/${Number(userId)}`;
    try {
        const response = await axios.put(url);
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при увеличении счетчика memCount: ${error.message}`);
    }
};

const incrementMemErrorCount = async (userId) => {
    const url = `${apiUrl}/incrementMemErrorCount/${Number(userId)}`;
    try {
        const response = await axios.put(url);
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при увеличении счетчика memErrorCount: ${error.message}`);
    }
};

const incrementRandomMemCount = async (userId) => {
    const url = `${apiUrl}/incrementRandomMemCount/${Number(userId)}`;
    try {
        const response = await axios.put(url);
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при увеличении счетчика randomMemCount: ${error.message}`);
    }
};

const incrementRandomMemErrorCount = async (userId) => {
    const url = `${apiUrl}/incrementRandomMemErrorCount/${Number(userId)}`;
    try {
        const response = await axios.put(url);
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при увеличении счетчика randomMemErrorCount: ${error.message}`);
    }
};

const enableMem = async (userId) => {
    const url = `${apiUrl}/enable/${userId}`;
    try {
        const response = await axios.post(url);
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при активации мема: ${error.message}`);
    }
};

const disableMem = async (userId) => {
    const url = `${apiUrl}/disable/${userId}`;
    try {
        const response = await axios.post(url);
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при деактивации мема: ${error.message}`);
    }
};

const getAllEnabledUserIds = async () => {
    const url = `${apiUrl}/enabled-user-ids`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при получении всех пользователей мема: ${error.message}`);
    }
};

module.exports = {
    incrementMemCount,
    incrementMemErrorCount,
    incrementRandomMemCount,
    incrementRandomMemErrorCount,
    enableMem,
    disableMem,
    getAllEnabledUserIds,
};