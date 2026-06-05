# Duma AI — New Stack Setup (R2 + Native Auth + VPS Postgres)

This replaces Supabase entirely. Storage is now Cloudflare R2, auth is native JWT,
and the database is your own Postgres. Work through each section once.

## 1. Environment variables

Set these in Vercel (Project → Settings → Environment Variables) and locally in `.env.local`.
See `.env.example` for the full annotated list.

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string + `&pgbouncer=true` (app runtime). |
| `DIRECT_URL` | Neon **unpooled** connection string — used only by `prisma migrate`. |
| `AUTH_JWT_SECRET` | ≥32 random chars. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `WEBHOOK_CALLBACK_SECRET` | Shared secret n8n must send back on callback + output-presign. |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 S3 API credentials. |
| `R2_BUCKET` | Bucket name (e.g. `duma-images`). |
| `R2_PUBLIC_DOMAIN` | Public custom domain on the bucket (e.g. `img.alltribeagency.io`). |
| `N8N_WEBHOOK_URL` | Existing image-processing webhook (app → n8n). |
| `N8N_NOTIFICATIONS_WEBHOOK_URL` | New notifications workflow (password reset, welcome, etc.). |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (free Upstash DB). |
| `NEXT_PUBLIC_APP_URL` | `https://duma.alltribeagency.io` |

## 2. Database (Neon — managed Postgres)

App + auth stay on Vercel; Neon hosts Postgres with TLS + pooling built in (nothing on the VPS exposed). The VPS/Easypanel is used for n8n only.

1. Create a project at [neon.tech](https://neon.tech). Pick a region close to your Vercel function region.
2. Dashboard → **Connect** → copy the connection string. Toggle **Pooled connection** ON for the app string; copy the **unpooled** one separately for migrations.
3. Set env (Neon strings already include `sslmode=require`):
   ```bash
   DATABASE_URL="postgresql://USER:PASS@ep-xxx-pooler.REGION.aws.neon.tech/duma?sslmode=require&pgbouncer=true"
   DIRECT_URL="postgresql://USER:PASS@ep-xxx.REGION.aws.neon.tech/duma?sslmode=require"
   ```
4. Create the schema (run locally with the env vars set, pointing at Neon):
   ```bash
   npx prisma migrate dev --name init_native_stack   # creates prisma/migrations + applies
   git add prisma/migrations && git commit -m "init migrations"
   npx prisma db seed                                # optional: seeds preset prompts
   ```
   For later deploys, run `npx prisma migrate deploy`.
   New tables vs. before: `Session`, `PasswordResetToken`, and `User.passwordHash` / `emailVerified`.

## 3. Cloudflare R2

1. Create a bucket (matches `R2_BUCKET`).
2. Connect a **public custom domain** to it (R2 → Settings → Public access → Custom domain), e.g. `img.alltribeagency.io`. Set `R2_PUBLIC_DOMAIN` to it.
3. Create an **R2 API token** (S3 Auth) → use the access key / secret / account id.
4. Set **CORS** on the bucket so the browser can PUT directly:
   ```json
   [
     {
       "AllowedOrigins": ["https://duma.alltribeagency.io", "http://localhost:3000"],
       "AllowedMethods": ["PUT", "GET", "HEAD"],
       "AllowedHeaders": ["content-type"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

## 4. n8n workflows

### a) Notifications workflow (new) — `N8N_NOTIFICATIONS_WEBHOOK_URL`
The app POSTs JSON like:
```json
{ "type": "password_reset", "email": "...", "userName": "...", "resetLink": "https://duma.alltribeagency.io/reset-password?token=...", "expiresInMinutes": 60 }
```
Other `type` values: `welcome`, `job_completed`, `job_failed`, `credit_low`.
Branch on `type` and send the email (your Hostinger mailbox / SMTP node). Requests include
header `X-Webhook-Secret: <WEBHOOK_CALLBACK_SECRET>` — verify it.

### b) Output upload to R2 (in the image-processing workflow)
After generating each output image, upload it straight to R2 via a presigned URL — no AWS
signing needed in n8n:
1. **HTTP Request** → `POST {{NEXT_PUBLIC_APP_URL}}/api/uploads/presign-output`
   - Header: `X-Webhook-Secret: <WEBHOOK_CALLBACK_SECRET>`
   - Body: `{ "jobId": "{{ $json.jobId }}", "contentType": "image/png", "count": 1 }`
   - Response: `{ "uploads": [ { "uploadUrl", "publicUrl" } ] }`
2. **HTTP Request (PUT)** → `{{ $json.uploads[0].uploadUrl }}`
   - Method `PUT`, Body = binary image, Header `Content-Type: image/png` (must match).
   - No auth — the signature is in the URL.
3. **HTTP Request (callback)** → `POST {{NEXT_PUBLIC_APP_URL}}/api/webhook/callback`
   - Header: `X-Webhook-Secret: <WEBHOOK_CALLBACK_SECRET>`
   - Body: `{ "jobId": "...", "status": "completed", "outputImages": ["<publicUrl>", ...] }`

> The callback now **rejects requests without the secret** — update existing n8n nodes to send the header.

## 5. Subdomain `duma.alltribeagency.io`

1. **Vercel** → Project → Settings → Domains → Add `duma.alltribeagency.io`.
2. **DNS** (at alltribeagency.io's DNS provider) → add the record Vercel shows, typically:
   `CNAME duma → cname.vercel-dns.com`
3. Set `NEXT_PUBLIC_APP_URL=https://duma.alltribeagency.io` in Vercel and redeploy.
4. Add the matching R2 image subdomain (`img.alltribeagency.io`) per section 3.

No code references hardcode the domain — everything uses `NEXT_PUBLIC_APP_URL` / request origin.

## 6. Auth model (reference)

- Access JWT (15 min) + rotating refresh token (7 days), both **httpOnly/Secure/SameSite=lax** cookies.
- `lib/auth/*` is the core; endpoints live under `/api/auth/*`.
- Middleware verifies the access token (jose) and gates protected routes; the browser silently
  calls `POST /api/auth/refresh` when the access token expires.
- Passwords: bcrypt (cost 12). Reset tokens are single-use, hashed at rest, 1-hour expiry.

## 7. Rate limits (aggressive)

Enforced in middleware via Upstash (per IP, sliding window):
- auth (login/register/reset): **5/min**
- uploads / job-create / purchases: **10/min**
- n8n webhooks: **60/min** (also secret-protected)
- general `/api`: **60/min**

Without Upstash env vars, limiting is skipped (dev) with a warning.
