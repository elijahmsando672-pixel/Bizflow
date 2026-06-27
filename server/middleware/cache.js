export const browserCache = (maxAge = 86400) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${maxAge}, immutable`);
      res.set('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
    }
    next();
  };
};

export const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};
