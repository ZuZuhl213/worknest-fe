import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse } from '../../types';

type ApiErrorBody = {
  code?: string;
  error?: string;
  fields?: Record<string, string>;
  message?: string;
  status?: number;
};

let accessToken: string | null = null;
let csrfToken: string | null = null;
let sessionVersion = 0;

const authChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('worknest_auth') : null;

if (authChannel) {
  authChannel.onmessage = (event) => {
    if (event.data === 'logout') {
      accessToken = null;
      sessionVersion += 1;
      window.dispatchEvent(new Event('auth-logout'));
    }
  };
}

export const beginSession = () => ++sessionVersion;

export const setAccessToken = (token: string | null, expectedSessionVersion?: number) => {
  if (expectedSessionVersion !== undefined && expectedSessionVersion !== sessionVersion) return false;
  if (token === null) sessionVersion += 1;
  accessToken = token;
  return true;
};

export const getSessionVersion = () => sessionVersion;

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

export const getApiErrorCode = (error: unknown) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.code;
  }
  return undefined;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

const clientOptions = {
  baseURL: apiBaseUrl,
  withCredentials: true,
};

const authClient = axios.create(clientOptions);

export const apiClient = axios.create(clientOptions);

export const fetchCsrfToken = async () => {
  const response = await authClient.get<{ token?: string }>('/api/auth/csrf');
  if (response.data?.token) {
    csrfToken = response.data.token;
    return;
  }

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
  const expectedSessionVersion = sessionVersion;
  await fetchCsrfToken();
  const response = await authClient.post<AuthResponse>('/api/auth/refresh');
  if (!setAccessToken(response.data.accessToken, expectedSessionVersion)) {
    throw new Error('Session changed while refreshing access token');
  }
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
let refreshPromiseVersion: number | null = null;

const forceLogout = () => {
  setAccessToken(null);
  authChannel?.postMessage('logout');
  window.dispatchEvent(new Event('auth-logout'));
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;
    if (!originalRequest) return Promise.reject(error);

    const isAuthUrl = ['/api/auth/login', '/api/auth/google', '/api/auth/register', '/api/auth/refresh']
      .some((path) => originalRequest.url?.includes(path));
    if (error.response?.status !== 401 || originalRequest._retry || isAuthUrl) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    if (!refreshPromise) {
      refreshPromiseVersion = sessionVersion;
      refreshPromise = refreshAccessToken()
        .then((session) => session.accessToken)
        .finally(() => {
          refreshPromise = null;
          refreshPromiseVersion = null;
        });
    }
    const expectedRefreshVersion = refreshPromiseVersion;

    try {
      const token = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      if (expectedRefreshVersion === sessionVersion) forceLogout();
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
