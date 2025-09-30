Bet Think Mobile (Expo + TypeScript)

Overview
- React Native app for the Bet Think sports-betting chat assistant.
- Expo SDK 51+, React Navigation 6, React Query, Zustand, React Native Paper.

Setup
1) Install dependencies at repo root: `yarn install`
2) Configure env via `app.config.ts` extras using EAS secrets:
   - API_URL, AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE
   - AMPLITUDE_API_KEY, SENTRY_DSN, EAS_PROJECT_ID
3) Start app: `yarn dev:mobile`

Architecture
- apps/mobile: Expo application
- packages/shared: shared types, logging, generated API client
- services/api, services/model: backend services (out of scope here)

Navigation & Linking
- Expo Router v3; scheme: `betthink://`
- Deep links: `betthink://chat/:threadId`

Security
- Auth0 Universal Login with PKCE; tokens stored in SecureStore.
- Logging is redacted in production.

Notifications
- expo-notifications registers device token and handles deep links.

Testing
- Jest + React Native Testing Library; Detox recommended for e2e.

