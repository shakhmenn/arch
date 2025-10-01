import { API_URL, getToken, setToken as persistToken } from './base-api.ts';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface HttpOptions extends RequestInit {
  method?: HttpMethod;
}

export type AnyJson = Record<string, unknown>;

export function extractToken(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as { access_token?: unknown; accessToken?: unknown; token?: unknown };
  const v = o.access_token ?? o.accessToken ?? o.token;
  return typeof v === 'string' ? v : null;
}

export async function http<T = unknown>(path: string, options: HttpOptions = {}): Promise<T> {
  const url = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${API_URL}/api${path.startsWith('/') ? '' : '/'}${path}`;

  const token = getToken();

  console.log('🌐 HTTP Request:', {
    path,
    url,
    method: options.method || 'GET',
    hasToken: !!token,
    body: options.body
  });

  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  const isAuthEndpoint = /\/auth\/(login|register)/.test(path);
  if (token && !headers.has('Authorization') && !isAuthEndpoint) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const resp = await fetch(url, { ...options, headers });
    const contentType = resp.headers.get('content-type') ?? '';

    let payload: unknown = null;
    if (contentType.includes('application/json')) {
      payload = await resp.json();
    } else {
      payload = await resp.text();
    }

    console.log('🌐 HTTP Response:', {
      url,
      status: resp.status,
      ok: resp.ok,
      payload
    });

    if (!resp.ok) {
      const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
      console.error('❌ HTTP Error:', { url, status: resp.status, message, payload });
      throw new Error(message || ('HTTP ' + String(resp.status)));
    }

    return payload as T;
  } catch (error) {
    console.error('❌ HTTP Request Failed:', { url, error });
    throw error;
  }
}

export const setToken = (token: string | null) => { persistToken(token); };
