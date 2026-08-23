# Neon PostgreSQL + Google Auth.js

ScarWrite supports two modes:

- **Google + Neon** when `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `AUTH_SECRET` are configured.
- **Offline / Guest Local** when those server variables are absent. No Google token or database connection is required for local use.

## 1. Neon

Create a Neon PostgreSQL database and set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
```

Then install dependencies and generate the Prisma client:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

The Prisma schema contains the Auth.js `User`, `Account`, `Session` and `VerificationToken` models.

## 2. Google OAuth

Create a Google OAuth Web Application and configure the callback URL for the deployed application:

```text
https://YOUR_DOMAIN/api/auth/callback/google
```

Set the server-only variables:

```env
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
AUTH_SECRET="a-long-random-secret"
```

Do not expose these values as `VITE_*` variables.

## 3. Auth.js endpoints

The TanStack Start server route exposes Auth.js at:

```text
/api/auth/*
```

The app uses the Auth.js Google provider and Prisma adapter. Successful Google sign-in creates or updates the user/account records in Neon.

## 4. Offline fallback

If any required server credential is missing, `/api/auth/status` reports `offline-local`. The application can continue using its existing localStorage/IndexedDB workflow without requiring Google or Neon.
