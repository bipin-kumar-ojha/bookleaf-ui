import axios from 'axios';

const apiClient = axios.create({
  // baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://bookleaf-backend-node.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token to every API call
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;