const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '');
const TOKEN_KEY = 'urbanmate_access_token';

let accessToken = sessionStorage.getItem(TOKEN_KEY);
let refreshPromise;

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function setAccessToken(token) {
  accessToken = token || null;
  if (accessToken) sessionStorage.setItem(TOKEN_KEY, accessToken);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    }).then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || !payload.data?.accessToken) {
        setAccessToken(null);
        throw new ApiError(payload?.message || 'Your session has expired. Please sign in again.', response.status);
      }
      setAccessToken(payload.data.accessToken);
      return payload.data.accessToken;
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function send(path, options = {}, token = accessToken) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
    body: options.body === undefined || options.body instanceof FormData
      ? options.body
      : JSON.stringify(options.body)
  });
  const payload = await response.json().catch(() => null);

  if (response.status === 401 && token && !options.retrying) {
    const refreshedToken = await refreshAccessToken();
    return send(path, { ...options, retrying: true }, refreshedToken);
  }
  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      payload?.message || `Request failed (${response.status})`,
      response.status,
      payload?.code,
      payload?.details
    );
  }
  return payload?.data;
}

export const api = {
  get(path, query) {
    const suffix = query ? `?${new URLSearchParams(query)}` : '';
    return send(`${path}${suffix}`);
  },
  post(path, body) {
    return send(path, { method: 'POST', body });
  },
  put(path, body) {
    return send(path, { method: 'PUT', body });
  },
  patch(path, body) {
    return send(path, { method: 'PATCH', body });
  }
};

export function getErrorMessage(error) {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}
