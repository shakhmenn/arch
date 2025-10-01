import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const rawBase = import.meta.env.VITE_BASE_URL as string | undefined;
const rawPort = import.meta.env.VITE_PORT as string | undefined;

function computeBase(): string {
  const explicit = String(rawApiUrl ?? '').trim();
  if (explicit) {
    return explicit.replace(/\/+$/, '');
  }

  const base = String(rawBase ?? '').trim();
  const port = String(rawPort ?? '').trim();

  if (base.startsWith('http://') || base.startsWith('https://')) {
    return base.replace(/\/+$/, '');
  }

  if (base) {
    const host = base.replace(/\/+$/, '');
    const portPart = port ? `:${port}` : '';
    return `http://${host}${portPart}`;
  }

  if (typeof window !== 'undefined') {
    const { origin, port: locPort } = window.location as Location & { port: string };
    if (locPort === '5173') {
      return 'http://localhost:3001';
    }
    return origin.replace(/\/+$/, '');
  }

  return 'http://localhost:3001';
}

export const API_URL = computeBase();

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token?: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    void 0;
  }
};

export const getUser = (): unknown => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setUser = (user?: unknown): void => {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    void 0;
  }
};

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = getToken();
  console.log('API Request:', {
    url: config.url,
    method: config.method,
    token: token ? 'present' : 'missing',
    data: config.data
  });

  const url = String(config.url ?? '');
  const isAuthEndpoint = /\/auth\/(login|register)(\b|\/?)$/.test(url);

  if (token && !isAuthEndpoint) {
    const current = (typeof config.headers === 'object')
      ? (config.headers as Record<string, string>)
      : {};
    const hasAuth = Object.prototype.hasOwnProperty.call(current, 'Authorization');
    if (!hasAuth) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      config.headers = { ...current, Authorization: `Bearer ${token}` } as Record<string, string>;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);
