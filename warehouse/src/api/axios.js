import axios from "axios";

const instance = axios.create({
    baseURL: 'http://localhost:8080/api',
});

instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        console.log('Current token:', token);
        console.log('Current user:', user);
        
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default instance;
