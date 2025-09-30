# Bet Think Mobile App

Production-ready React Native mobile application for Bet Think, a sports-betting chat assistant built with Expo and TypeScript.

## 🏗️ Architecture Overview

```
Bet Think Mobile App
├── Authentication (Auth0 + PKCE)
├── Chat Interface (SSE Streaming)
├── Betting Flow (Deep Linking)
├── Local-First Storage (SQLite)
├── Push Notifications
├── Analytics & Error Tracking
└── OTA Updates (EAS)
```

### Microservices Integration

- **services/api**: Backend REST and SSE endpoints
- **services/model**: LLM inference service
- **packages/shared**: Shared types and utilities
- **apps/mobile**: This mobile client

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- iOS Simulator (macOS) or Android Emulator
- Auth0 account and application
- Amplitude account (for analytics)
- Sentry account (for error tracking)

### Installation

```bash
cd apps/mobile
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Configure environment variables:
```env
APP_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=your-client-id
EXPO_PUBLIC_AUTH0_AUDIENCE=https://api.betthink.app
EXPO_PUBLIC_AMPLITUDE_API_KEY=your-amplitude-key
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
```

3. For Auth0 setup:
   - Create a Native Application in Auth0
   - Add callback URLs: `betthink://callback`, `https://betthink.app/callback`
   - Enable PKCE flow
   - Configure allowed logout URLs

### Running the App

#### Development

```bash
npm start           # Start Expo dev server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator
npm run web         # Run in web browser
```

#### Testing

```bash
npm test                    # Run unit tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
npm run test:e2e:build:ios  # Build iOS for E2E
npm run test:e2e            # Run E2E tests
```

#### Linting & Formatting

```bash
npm run lint         # Check for issues
npm run lint:fix     # Auto-fix issues
npm run format       # Format code
npm run type-check   # TypeScript validation
```

## 📱 Features

### Authentication

- **Auth0 Universal Login** with PKCE flow
- Secure token storage using Expo SecureStore
- Automatic token refresh with 5-minute buffer
- Session persistence across app restarts

### Chat Interface

- Real-time SSE streaming for LLM responses
- Automatic reconnection with exponential backoff (max 5 retries)
- Optimistic UI updates for instant feedback
- Local-first architecture with SQLite persistence
- Offline support with automatic sync when online

### Betting Flow

1. User asks about bets → AI recommends wagers
2. Bet recommendation triggers bottom sheet
3. User reviews: stake, odds, potential payout, sportsbook
4. On confirmation:
   - Bet saved to API
   - Deep link opens sportsbook app in **guide mode**
   - Analytics tracked
5. User manually places bet in sportsbook app

**Note**: No programmatic bet placement—always in guide mode.

### Push Notifications

- Expo push notifications for bet results, reminders, messages
- Foreground and background handling
- Deep linking to relevant chat threads
- Device token registration with backend
- Android notification channels

### Local Storage

- **SQLite** for chat threads and messages
- Optimistic updates with conflict resolution
- Automatic background sync
- Manual sync option in settings
- Graceful offline degradation

### Analytics & Error Tracking

#### Amplitude Events

- `app_opened`
- `session_started`
- `chat_message_sent`
- `chat_message_received`
- `bet_recommendation_shown`
- `bet_confirmed`
- `bet_cancelled`
- `sportsbook_redirect`
- `notification_received`
- `notification_opened`
- `error_occurred`
- `sse_connection_established`
- `sse_connection_failed`
- `sse_reconnection_attempted`

#### Sentry Integration

- Automatic crash reporting
- Breadcrumb tracking for debugging
- User context and custom tags
- Source maps for production builds
- Performance monitoring (20% sample rate in prod)

### Theme Support

- Light and Dark themes
- System preference detection
- Manual theme selection
- React Native Paper Material Design 3

### Accessibility

- Semantic labels on all interactive elements
- Screen reader support (VoiceOver/TalkBack)
- WCAG AA contrast ratios
- Keyboard navigation support
- Accessible form inputs

## 🗂️ Project Structure

```
apps/mobile/
├── __tests__/              # Unit tests
├── e2e/                    # E2E tests (Detox)
├── src/
│   ├── api/                # API client and endpoints
│   ├── components/         # Reusable UI components
│   │   ├── ErrorBoundary.tsx
│   │   ├── ChatMessage.tsx
│   │   └── BetConfirmationSheet.tsx
│   ├── config/             # App configuration
│   │   ├── index.ts
│   │   └── react-query.ts
│   ├── hooks/              # Custom React hooks
│   │   ├── useChat.ts
│   │   ├── useSSEStream.ts
│   │   └── useBetting.ts
│   ├── navigation/         # React Navigation setup
│   │   ├── RootNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── types.ts
│   ├── screens/            # Screen components
│   │   ├── AuthScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/           # Business logic services
│   │   ├── auth.service.ts
│   │   ├── sse.service.ts
│   │   ├── database.service.ts
│   │   ├── notification.service.ts
│   │   ├── analytics.service.ts
│   │   └── error-tracking.service.ts
│   ├── stores/             # Zustand state management
│   │   ├── auth.store.ts
│   │   ├── chat.store.ts
│   │   └── ui.store.ts
│   ├── theme/              # Theming configuration
│   │   └── index.ts
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
│       └── logger.ts
├── App.tsx                 # App entry point
├── app.config.ts           # Expo configuration
├── eas.json                # EAS Build configuration
├── package.json
└── tsconfig.json
```

## 🏗️ Build & Deploy

### EAS Build Profiles

```bash
# Development builds (internal distribution)
eas build --profile development --platform ios
eas build --profile development --platform android

# Staging builds
eas build --profile staging --platform all

# Production builds
eas build --profile production --platform all
```

### OTA Updates

```bash
# Development channel
npm run update:dev "Fix chat scrolling"

# Staging channel
npm run update:staging "Add bet filters"

# Production channel
npm run update:prod "Performance improvements"
```

### Environment Profiles

- **Development**: Debug enabled, verbose logging, dev API
- **Staging**: Production-like, staging API, internal testers
- **Production**: Optimized, error tracking, analytics, prod API

## 🔐 Security

### Token Management

- Access tokens stored in Expo SecureStore (iOS Keychain/Android Keystore)
- Automatic refresh 5 minutes before expiration
- Secure token transmission (HTTPS only)
- No tokens in logs (production)

### Data Privacy

- Sensitive data redacted in logs
- User data encrypted at rest (device encryption)
- No analytics in development
- GDPR-compliant data handling

### Deep Link Security

- Validated deep link schemes
- No sensitive data in deep links
- Guide mode only (no programmatic bet placement)
- User confirmation required

## 📊 Analytics Taxonomy

### User Properties

- `user_id`: Auth0 user ID
- `email`: User email
- `platform`: ios/android
- `app_version`: Current version
- `environment`: dev/staging/prod

### Event Properties

- `timestamp`: Event time (ms)
- `session_id`: Current session ID
- `chat_id`: Active chat thread
- `bet_id`: Bet recommendation ID
- `sportsbook`: Sportsbook name
- `sport`: Sport type
- `error_code`: Error identifier

## 🧪 Testing Strategy

### Unit Tests (Jest + RNTL)

- Service logic (auth, database, API)
- Custom hooks (useChat, useBetting)
- Utility functions
- State management (Zustand stores)
- Component rendering

### Integration Tests

- API client with mocked endpoints
- Database operations
- SSE streaming logic
- Navigation flows

### E2E Tests (Detox)

- Authentication flow
- Chat message sending/receiving
- Bet confirmation flow
- Deep linking
- Push notifications

### Coverage Goals

- Services: 80%+
- Hooks: 75%+
- Components: 70%+
- Overall: 70%+

## 🤝 Contributing

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier enforced
- Functional components with hooks
- Meaningful variable names
- JSDoc comments for complex logic

### PR Requirements

1. All tests passing
2. No TypeScript errors
3. No linter warnings
4. Coverage maintained/improved
5. Changelog updated
6. Screenshots for UI changes

### Commit Convention

```
feat: Add bet filtering
fix: Resolve SSE reconnection issue
docs: Update README
test: Add chat hook tests
refactor: Simplify auth logic
chore: Update dependencies
```

## 🔍 Troubleshooting

### Common Issues

**Auth0 login fails**
- Verify callback URLs in Auth0 dashboard
- Check `EXPO_PUBLIC_AUTH0_CLIENT_ID` in `.env`
- Ensure PKCE is enabled

**SSE streaming not working**
- Check API endpoint is accessible
- Verify token is valid
- Check network connection
- Review SSE service logs

**Deep linking not working**
- Verify sportsbook app is installed
- Check deep link scheme configuration
- Review `app.config.ts` scheme settings

**Push notifications not received**
- Check device permissions
- Verify Expo push token in settings
- Ensure device is registered with backend
- Check notification service initialization

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://reactnativepaper.com/)
- [React Query](https://tanstack.com/query/latest)
- [Auth0 React Native](https://auth0.com/docs/quickstart/native/react-native)
- [Amplitude React Native](https://www.docs.developers.amplitude.com/data/sdks/react-native/)
- [Sentry React Native](https://docs.sentry.io/platforms/react-native/)

## 📄 License

Proprietary - All rights reserved

## 👥 Team

For questions or support, contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2025-09-30
