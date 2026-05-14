import axios from 'axios';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Cache TTL para GET requests públicos (não autenticados)
const CACHEABLE = ['/config', '/categories', '/products', '/reviews'];
const TTL_MS = 5 * 60 * 1000; // 5 minutos
const _cache = new Map();

function cacheKey(url, params) {
  return url + (params ? JSON.stringify(params) : '');
}

function shouldCache(url, config) {
  if (config?.headers?.Authorization) return false;
  if (url.startsWith('/products/')) return false; // página de produto sempre fresca
  return CACHEABLE.some(p => url.startsWith(p));
}

const _get = api.get.bind(api);
api.get = function (url, config) {
  if (typeof window === 'undefined' || !shouldCache(url, config)) {
    return _get(url, config);
  }
  const key = cacheKey(url, config?.params);
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return Promise.resolve(cached.res);
  }
  return _get(url, config).then(res => {
    _cache.set(key, { res, ts: Date.now() });
    return res;
  });
};

api.clearCache = (urlPrefix) => {
  if (!urlPrefix) { _cache.clear(); return; }
  for (const key of _cache.keys()) {
    if (key.startsWith(urlPrefix)) _cache.delete(key);
  }
};

export default api;
