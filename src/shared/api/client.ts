import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse } from '../../types';

type ApiErrorBody = {
  error?: string;
  fields?: Record<string, string>;
  message?: string;
  status?: number;
};

let accessToken: string | null = null;
let csrfToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return 'Unable to connect to the server. Please check your connection and try again.';
    }

    const data = error.response.data;
    if (data?.message) return data.message;
    if (data?.fields && Object.keys(data.fields).length > 0) {
      return Object.entries(data.fields)
        .map(([field, message]) => `${field}: ${message}`)
        .join('; ');
    }
    if (data?.error) return data.error;
  }
  return fallback;
};

export const getApiFieldErrors = (error: unknown) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.fields ?? {};
  }
  return {};
};

const clientOptions = {
  baseURL: '',
  withCredentials: true,
};

const authClient = axios.create(clientOptions);

export const apiClient = axios.create(clientOptions);

export const fetchCsrfToken = async () => {
  await authClient.get('/api/auth/csrf');
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('XSRF-TOKEN='));

  if (!cookie) {
    throw new Error('CSRF cookie was not issued by the server');
  }

  csrfToken = decodeURIComponent(cookie.slice('XSRF-TOKEN='.length));
};

const attachCsrfToken = (config: InternalAxiosRequestConfig) => {
  if (csrfToken) {
    config.headers['X-XSRF-TOKEN'] = csrfToken;
  }
  return config;
};

authClient.interceptors.request.use(attachCsrfToken);

export const refreshAccessToken = async () => {
  await fetchCsrfToken();
  const response = await authClient.post<AuthResponse>('/api/auth/refresh');
  setAccessToken(response.data.accessToken);
  return response.data;
};

apiClient.interceptors.request.use((config) => {
  attachCsrfToken(config);
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshPromise: Promise<string> | null = null;

const forceLogout = () => {
  setAccessToken(null);
  window.dispatchEvent(new Event('auth-logout'));
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;
    if (!originalRequest) return Promise.reject(error);

    const isAuthUrl = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh']
      .some((path) => originalRequest.url?.includes(path));
    if (error.response?.status !== 401 || originalRequest._retry || isAuthUrl) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken()
        .then((session) => session.accessToken)
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const token = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      forceLogout();
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
