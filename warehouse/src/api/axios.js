import axios from "axios";


const instance = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL, // Replace with your API base URL
});

instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Replace with your token retrieval method
        console.log(token);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`; // Adjust the header key as needed
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
export default instance;
