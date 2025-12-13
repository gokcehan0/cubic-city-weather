import axios from 'axios';

// Production API URL (Render)
const BASE_URL = 'https://cubic-weather-api.onrender.com/api';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default client;
