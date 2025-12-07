import axios from 'axios';
import { addToQueue } from '../utils/offlineQueue';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration and offline mode
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // If offline and it's a POST/PUT/DELETE request, queue it
    if (!navigator.onLine && error.config && ['post', 'put', 'delete', 'patch'].includes(error.config.method)) {
      try {
        await addToQueue({
          method: error.config.method.toUpperCase(),
          url: error.config.url.replace(API_URL, ''),
          data: error.config.data,
        });
        // Return a mock success response
        return Promise.resolve({ data: { queued: true }, status: 200 });
      } catch (queueError) {
        console.error('Failed to queue action:', queueError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;

