# Chat Summary — Bizflow Deployment

## What was done

### Build fix
- `client/src/types/reports.ts` was missing from commit `ddbc775` — already added in `de87968` (included in current HEAD)

### CORS fix (`server/index.js`)
- Now also accepts `APP_URL` and `NEXT_PUBLIC_API_URL` as allowed CORS origins
- Logs blocked origins with the allowed list

### DB config (`server/config/db.js`)
- Added `DATABASE_URL` support (Railway's standard Postgres connection string)
- Added `ssl: { rejectUnauthorized: false }` for production (required by Railway)

## Commits pushed
- `1ddae27` — Trigger redeploy
- `95fccd0` — Fix CORS config for Vercel + Railway
- `be01693` — Add DATABASE_URL support for Railway Postgres

## Pending

### Vercel setup (frontend)
1. Go to https://vercel.com/new
2. Import `elijahmsando672-pixel/Bizflow`
3. Set Root Directory to `client/`
4. Deploy (no env vars needed to verify it loads)

### Railway setup (backend)
1. Add Postgres plugin
2. Set env vars:
   - `JWT_SECRET` — generate with `openssl rand -base64 64`
   - `NODE_ENV` = `production`
   - `CORS_ORIGINS` = Vercel frontend URL
   - `APP_URL` = Vercel frontend URL
   - `DATABASE_URL` — auto-provided by Railway Postgres

### Connect frontend to backend
- Set `NEXT_PUBLIC_API_URL` in Vercel environment variables to Railway backend URL (e.g. `https://your-app.up.railway.app/api`)
- Redeploy Vercel after setting the env var

### Login issue
- "Unable to fetch for signing in" on phone — caused by missing `NEXT_PUBLIC_API_URL` in Vercel and/or misconfigured CORS on Railway
