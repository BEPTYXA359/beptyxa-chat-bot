const axios = require('axios');

const convertUserTelegramData = (userData) => {
    return userData.id > 0 ? {
        id: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        languageCode: userData.language_code,
        isPremium: userData.is_premium
    } : {
        id: userData.id,
        title: userData.title,
        type: userData.type,
    }
}

const upsertUser = async (userData) => {
    try {
        const response = await axios.post(`${process.env.BASE_API_URL}/api/users`, convertUserTelegramData(userData));
        return response.data;
    } catch (error) {
        throw new Error(`Ошибка при добавлении пользователя: ${error.message}`);
    }
};

module.exports = {
    addUser: upsertUser,
};