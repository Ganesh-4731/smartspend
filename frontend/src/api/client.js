import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20000,
});

// Unwrap the { success, data, meta } envelope; centralise 401 handling.
http.interceptors.response.use(
  (res) => (res.config.responseType === 'blob' ? res : res.data),
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.startsWith('/auth/')) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (err?.message === 'Network Error') return 'Cannot reach the server. Check your connection and that the API is running.';
  return err?.message || fallback;
}
// Returns [{field, message}] from a validation error response, if any.
export const getFieldErrors = (err) => err?.response?.data?.errors || [];

export default http;
