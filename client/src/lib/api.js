const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://urbanmate.towsindia.com/api/v1').replace(/\/$/, '');
export const SERVER_BASE = API_BASE.replace(/\/api\/v1\/?$/, '');

export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads/')) {
    return `${SERVER_BASE}${trimmed}`;
  }
  if (trimmed.startsWith('uploads/')) {
    return `${SERVER_BASE}/${trimmed}`;
  }
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = trimmed.replace(/^\//, '');
  return `${cleanBase}${cleanPath}`;
}

export function assetUrl(path) {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = trimmed.replace(/^\//, '');
  return `${cleanBase}${cleanPath}`;
}

const TOKEN_KEY = 'urbanmate_access_token';

let accessToken = typeof window !== 'undefined'
  ? (localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY))
  : null;
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

function getApiError(payload) {
  const error = payload?.error || payload;
  return {
    message: error?.message,
    code: error?.code,
    details: error?.details
  };
}

export function setAccessToken(token) {
  accessToken = token || null;
  if (typeof window !== 'undefined') {
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
      sessionStorage.setItem(TOKEN_KEY, accessToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }
}

export function getAccessToken() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (stored) {
      accessToken = stored;
      return stored;
    }
  }
  return accessToken;
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    }).then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || !payload.data?.accessToken) {
        setAccessToken(null);
        const apiError = getApiError(payload);
        throw new ApiError(
          apiError.message || 'Your session has expired. Please sign in again.',
          response.status,
          apiError.code,
          apiError.details
        );
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
    try {
      const refreshedToken = await refreshAccessToken();
      return send(path, { ...options, retrying: true }, refreshedToken);
    } catch (refreshErr) {
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('urbanmate:unauthorized'));
      }
      throw refreshErr;
    }
  }
  if (!response.ok || payload?.success === false) {
    if (response.status === 401) {
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('urbanmate:unauthorized'));
      }
    }
    const apiError = getApiError(payload);
    throw new ApiError(
      apiError.message || `Request failed (${response.status})`,
      response.status,
      apiError.code,
      apiError.details
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
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}
