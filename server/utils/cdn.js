const CDN_URL = (process.env.CDN_URL || '').replace(/\/+$/, '');
const APP_URL = (process.env.APP_URL || 'http://localhost:5000').replace(/\/+$/, '');

export const cdnUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = CDN_URL || APP_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

export const cdnImage = (path, size = null) => {
  if (!path) return null;
  const url = cdnUrl(path);
  if (!size) return url;
  const ext = path.split('.').pop();
  const base = path.replace(`.${ext}`, '');
  const cdnBase = CDN_URL || APP_URL;
  return `${cdnBase}/${size}_${base}.webp`;
};

export const isCdnConfigured = () => !!CDN_URL;
