# UniBookExchange (UBE)

UniBookExchange is a cross-platform app for university students to discover, buy, sell, and exchange textbooks. It is built with Expo and React Native, with an Express API and PostgreSQL database.

## Features

- Create an account and sign in without registration email verification
- Reset a forgotten password using an email OTP
- Browse books and filter by major, year, or search term
- Post and manage your own book listings
- Request and manage appointments with buyers or sellers
- Mark listings as available or sold
- View and update your student profile
- Responsive layouts for mobile screens and web

## Tech stack

- **App:** Expo SDK 58, React Native, Expo Router, TypeScript
- **API:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Email:** Resend for password-reset OTP delivery

## Requirements

- Node.js and npm
- A PostgreSQL database
- A Resend account and API key for password-reset email OTP delivery

## Getting started

### 1. Configure the API

In PowerShell, from the repository root:

```powershell
Copy-Item server\.env.example server\.env
```

Update `server/.env` with your own values:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
RESEND_API_KEY=your_resend_api_key
RESEND_TEST_RECIPIENT=your_test_email@example.com
OTP_SECRET=replace_with_a_random_secret_at_least_32_bytes_long
PORT=4000
DEV_OTP_LOGGING=false
```

Keep `server/.env` private; never commit API keys, database credentials, or other secrets.

Install the API dependencies, generate the Prisma client, and apply the development migrations:

```powershell
cd server
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

The API listens on port `4000` by default. Check that it is running at `http://localhost:4000/health`.

### 2. Configure and run the app

Create `.env.local` in the repository root:

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
```

Choose a URL reachable from the device running the app:

- Web on the same computer: `http://localhost:4000`
- Standard Android emulator: `http://10.0.2.2:4000`
- Physical device: `http://<your-computer-lan-ip>:4000`

In a second terminal, from the repository root:

```powershell
npm install
npx expo start
```

Use the Expo CLI prompts to open the app on a device, emulator, or web browser. You can also run `npm run web` for web or `npm run android` for Android.

## Password-reset OTP and production email

Resend's default test sender is restricted to the recipient allowed by your Resend account. Set `RESEND_TEST_RECIPIENT` to that address for local testing.

For local development only, `DEV_OTP_LOGGING=true` allows password-reset OTPs for non-test recipients to be printed in the API terminal when `NODE_ENV` is not `production`. Registration does not send an OTP. Do not enable development OTP logging in production; the server disables it there.

Before production deployment, configure a verified sending domain and a production-safe sender and recipient policy. Do not rely on a single test inbox to deliver password-reset codes to all users. Deploy the API behind HTTPS, use production database credentials, set `NODE_ENV=production`, and configure the app's `EXPO_PUBLIC_API_URL` to the deployed API.

For production database updates, apply committed migrations from the `server` directory:

```powershell
npx prisma migrate deploy
```

Do not use `prisma migrate reset` on production data.

## Checks

Run the app tests and TypeScript check from the repository root:

```powershell
npm test
npx tsc --noEmit
```

Run the API tests and type check from `server`:

```powershell
npm test
npm run typecheck
```

## Project structure

```text
src/
  app/          Expo Router routes
  components/   App screens and reusable UI
  services/     API client
  utils/        Shared utilities and tests
server/
  prisma/       Database schema and migrations
  src/          Express API
  tests/        API tests
```

## License

No license has been specified yet. All rights are reserved unless a license is added to this repository.
