import axios from 'axios';

/** Local Vite proxy uses `/api`; production sets `VITE_API_URL` to the API origin + `/api`. */
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? 'Request failed';
    const normalized = Array.isArray(message) ? message.join(', ') : message;
    return Promise.reject(new Error(normalized));
  },
);

export default api;
