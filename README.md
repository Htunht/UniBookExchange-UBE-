# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Backend (Express, Resend, Prisma)

The app's email OTP and profile API lives in `server/`. The backend uses PostgreSQL through Prisma and sends one-time codes through Resend. In Resend test mode, set `RESEND_TEST_RECIPIENT` to the email address authorized by your Resend account; arbitrary recipients require a verified sending domain.

1. Create a PostgreSQL database and copy `server/.env.example` to `server/.env`. Set `DATABASE_URL`, `RESEND_API_KEY`, `RESEND_TEST_RECIPIENT`, and a random `OTP_SECRET` of at least 32 characters.
2. From `server/`, run `npm install`, `npm run db:generate`, and `npm run db:migrate`.
3. Start the API with `npm run dev`. It listens on port 4000 by default.
4. Create `.env.local` in the project root and set `EXPO_PUBLIC_API_URL` to the backend URL reachable by the app. Use `http://localhost:4000` for web on the same computer, `http://10.0.2.2:4000` for the standard Android emulator, or your computer's LAN IP for a physical device on the same network.
5. Start Expo with `npx expo start`.

Keep the Resend API key and database URL on the backend only. For production, deploy the API and PostgreSQL database, use HTTPS, and configure the app's API URL to the deployed service.

The current Resend test configuration only sends OTP email to `RESEND_TEST_RECIPIENT`. For local testing with another address, set `DEV_OTP_LOGGING=true` in `server/.env`; outside production, the OTP is written to the API terminal and is never returned to the app. Set `NODE_ENV=production` in production (OTP logging is always disabled there). Before enabling email delivery for other addresses, configure a verified Resend sender domain and update the server's sender address and recipient policy.

When deploying schema changes to production, apply committed migrations with `npx prisma migrate deploy` from `server/` before restarting the API. Do not use `migrate reset` on production data.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
