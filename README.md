# UniBookExchange (UBE)

UniBookExchange is a mobile-first book marketplace for university students. Students can list textbooks, browse other students' books, request to buy a book, and coordinate with the seller.

## Problem and purpose

Students often need course books for a specific major and year, while other students may have those books available after using them. Finding the right book, checking whether it is still available, and contacting its owner can otherwise take place across separate channels.

UBE brings listings and buyer-seller requests into one app. A buyer can find books by title, major, or year and send a request. The seller can accept or reject it; after acceptance, the buyer can view the seller's contact details and arrange the next step directly. The app helps students connect; it does not process payments or arrange delivery.

## Target users

- University students looking for textbooks for their major and year.
- Students who want to sell or give away books they no longer need.
- Buyers and sellers who want a simple way to manage requests and share contact details after a request is accepted.

## Features

- Create an account, sign in, and reset a password with an email OTP.
- Browse books posted by other users; search and filter by major and year.
- Create, edit, delete, and mark your own listings as sold.
- Request to buy a book and view incoming or sent requests.
- Accept or reject a request. The buyer receives a push notification when the seller responds.
- View and update profile details, including phone and Telegram username.
- Show an offline message when the device cannot reach the API.

## Tech stack

- **Expo SDK 58 + React Native:** Builds the cross-platform mobile app and web interface.
- **Expo Router:** Defines and navigates between app screens.
- **TypeScript:** Adds static types to the app and API code.
- **Node.js + Express 5:** Runs the JSON API for authentication, profiles, books, and buyer-seller requests.
- **PostgreSQL + Prisma 7:** Stores users, books, appointments, sessions, and push tokens.
- **Resend:** Sends email OTPs. Production delivery is currently restricted to the configured test recipient; see [Email delivery limitation](#email-delivery-limitation).
- **Expo Push Service:** Sends appointment status notifications to registered devices.
- **EAS Build:** Creates cloud Android and iOS app builds.

## Requirements

- Node.js 22.13 or newer and npm
- PostgreSQL database
- Resend API key and an allowed test recipient for OTP email
- EAS account for cloud Android/iOS builds

## Run locally

### 1. Configure and start the API

From the repository root, copy the example environment file:

```powershell
Copy-Item server\.env.example server\.env
```

Set the values in `server/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
RESEND_API_KEY=your_resend_api_key
RESEND_TEST_RECIPIENT=your_test_email@example.com
OTP_SECRET=replace_with_a_random_secret_at_least_32_bytes_long
PORT=4000
DEV_OTP_LOGGING=false
```

`OTP_SECRET` must contain at least 32 bytes. Keep `server/.env` private; do not commit database credentials, API keys, or secrets.

Install dependencies and initialize the local database:

```powershell
cd server
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

The API listens at `http://localhost:4000` by default. Check `http://localhost:4000/health` for a health response. `PORT` can be set to another available port.

### 2. Configure and start the app

Create `.env.local` in the repository root:

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
```

Use an API address reachable from the device running the app:

| Target | Example API URL |
| --- | --- |
| Web on the development computer | `http://localhost:4000` |
| Android emulator | `http://10.0.2.2:4000` |
| Physical phone on the same Wi-Fi | `http://<computer-LAN-IP>:4000` |

In a second terminal, from the repository root:

```powershell
npm install
npx expo start
```

Use the Expo CLI prompts to open the app. Other available commands are `npm run android`, `npm run ios`, and `npm run web`.

## Push notifications

Android remote push notifications require an installed development or EAS build and notification permission. **Remote push notifications do not work in Expo Go on Android.** The project has an EAS project ID and an `appointments` Android notification channel configured. See the [Expo SDK 58 notifications guide](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/) for device and credential setup.

The app's `preview` EAS profile creates an installable Android APK:

```powershell
npx eas-cli@latest build --profile preview --platform android
```

The `production` profile creates a production Android build. Push delivery also requires valid Android push credentials in the EAS project and the recipient to have signed in with a build that registered its push token.

## Deploy the API

The API lives in `server/` and includes `server/vercel.json` for the Express deployment. In Vercel, set the project **Root Directory** to `server`, then configure these environment variables:

- `DATABASE_URL`
- `RESEND_API_KEY`
- `RESEND_TEST_RECIPIENT`
- `OTP_SECRET` (at least 32 bytes)
- `NODE_ENV=production`
- `DEV_OTP_LOGGING=false`

Deploy the project after setting the environment variables. The app's EAS profiles already point `EXPO_PUBLIC_API_URL` at the current UBE API deployment; change the value in `eas.json` if the API domain changes. For local app development, set the URL in `.env.local` instead.

### Email delivery limitation

The API currently uses Resend's test sender (`onboarding@resend.dev`) and only sends OTP email to `RESEND_TEST_RECIPIENT` in production. Before enabling OTP delivery to all users, configure a verified sending domain in Resend and update the API's sender and recipient policy. `DEV_OTP_LOGGING=true` can print non-test OTPs in a non-production environment for development only; never enable it in production.

Before deploying production database changes, apply committed migrations from the `server` directory:

```powershell
npx prisma migrate deploy
```

Do not run `prisma migrate reset` against production data. Keep production database credentials and service keys private.

## Checks

From the repository root:

```powershell
npm test
npx tsc --noEmit
npx expo lint
```

From `server/`:

```powershell
npm test
npm run typecheck
npm run build
```

## Project structure

```text
src/
  app/          Expo Router routes
  components/   Screens and reusable UI
  screens/      Authentication and dashboard screens
  services/     API client, session storage, notifications
  utils/        Labels, sorting, and shared rules
server/
  prisma/       PostgreSQL schema and migrations
  src/          Express API and Prisma client setup
  tests/        API unit tests
```

## License

No license has been specified. All rights are reserved unless a license is added to this repository.
