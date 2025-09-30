# Bet Think Mobile Application

A production-ready React Native mobile application for Bet Think, a sports-betting chat assistant powered by AI.

## 🏗 Architecture Overview

Bet Think Mobile is built as the client application within a microservices architecture:

```
┌─────────────────────────────────────────────────────┐
│                   Mobile App (This)                  │
│                  React Native + Expo                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   ├── Auth0 (Authentication)
                   ├── API Service (REST + SSE)
                   ├── Model Service (LLM)
                   └── Analytics/Monitoring
```

### Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: Zustand + React Query
- **Authentication**: Auth0 with PKCE
- **UI Components**: Tamagui (performance-optimized)
- **Analytics**: Amplitude
- **Error Tracking**: Sentry
- **Push Notifications**: Expo Notifications
- **Local Storage**: AsyncStorage + SQLite

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on physical device (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/betthink/mobile.git
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm start
```

### Running on Devices

- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: Scan QR code with Expo Go app

## 📱 Features

### Core Functionality

- **AI Chat Assistant**: Real-time SSE streaming for LLM responses
- **Bet Recommendations**: Personalized betting suggestions with confidence scores
- **Bet Confirmation Flow**: Review and confirm bets before redirecting to sportsbooks
- **Deep Linking**: Seamless integration with sportsbook apps
- **Offline Support**: Local-first architecture with sync capabilities
- **Push Notifications**: Real-time updates for chat messages and bet status

### Security Features

- **Auth0 Integration**: Universal Login with PKCE flow
- **Secure Token Storage**: Using Expo SecureStore
- **Automatic Token Refresh**: Seamless session management
- **Data Encryption**: Sensitive data encrypted at rest
- **Biometric Authentication**: Face ID/Touch ID support

### User Experience

- **Theme Support**: Light/Dark mode with system preference detection
- **Accessibility**: Full screen reader support and keyboard navigation
- **Error Boundaries**: Graceful error handling with user-friendly fallbacks
- **Optimistic Updates**: Instant UI feedback for better perceived performance
- **Pull-to-Refresh**: Standard mobile patterns for data refresh

## 🏛 Project Structure

```
mobile/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/           # Screen components
│   ├── navigation/        # Navigation configuration
│   ├── services/          # API and external services
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript type definitions
│   ├── constants/        # App constants
│   └── config/           # Configuration files
├── assets/               # Images, fonts, etc.
├── app.config.ts         # Expo configuration
├── eas.json             # EAS Build configuration
├── jest.config.js       # Jest testing configuration
└── package.json         # Dependencies and scripts
```

## 🔐 Authentication Flow

1. User initiates login through Auth0 Universal Login
2. PKCE flow ensures secure authentication
3. Tokens stored securely in device keychain
4. Automatic token refresh on expiry
5. Biometric authentication for app access (optional)

```typescript
// Authentication flow
User → Auth0 Login → PKCE Challenge → Token Exchange → Secure Storage
```

## 💬 Chat & Streaming

The app implements Server-Sent Events (SSE) for real-time chat streaming:

```typescript
// SSE Stream Processing
API Stream → Parse Chunks → Update UI → Handle Recommendations → Store Locally
```

### Connection Handling

- Automatic reconnection on network failures
- Exponential backoff for retry logic
- Fallback to polling if SSE unavailable
- Queue messages during offline periods

## 🎯 Betting Flow

1. **Recommendation**: AI suggests a bet based on analysis
2. **Review**: User reviews bet details in bottom sheet
3. **Confirmation**: User confirms the bet
4. **Deep Link**: App opens sportsbook with pre-filled bet slip
5. **Return**: User returns to app after placing bet

```typescript
// Bet Confirmation Flow
Recommendation → Bottom Sheet → Confirm → Deep Link → Sportsbook → Return
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests (Detox)
```bash
# Build for testing
npm run build:e2e

# Run tests
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

## 📦 Building & Deployment

### Development Build
```bash
eas build --profile development --platform all
```

### Staging Build
```bash
eas build --profile staging --platform all
```

### Production Build
```bash
eas build --profile production --platform all
```

### Over-the-Air Updates
```bash
eas update --branch production --message "Update description"
```

## 📊 Analytics Events

Key events tracked for user behavior analysis:

- `app_opened`: App launch
- `user_signed_in`: Successful authentication
- `chat_started`: New chat session
- `message_sent`: User sends message
- `bet_recommended`: AI recommends bet
- `bet_confirmed`: User confirms bet
- `sportsbook_opened`: Deep link activated
- `error_occurred`: Error tracking

## 🔧 Environment Configuration

### Development
- API: `http://localhost:3000`
- Auth0: Development tenant
- Analytics: Disabled
- Crash Reporting: Disabled

### Staging
- API: `https://staging-api.betthink.com`
- Auth0: Staging tenant
- Analytics: Enabled (sampled)
- Crash Reporting: Enabled

### Production
- API: `https://api.betthink.com`
- Auth0: Production tenant
- Analytics: Enabled
- Crash Reporting: Enabled

## 🚨 Error Handling

The app implements comprehensive error handling:

1. **Error Boundaries**: Catch and display friendly error messages
2. **Sentry Integration**: Automatic crash reporting
3. **Structured Logging**: Debug/Info/Warn/Error levels
4. **User Feedback**: Clear error messages with recovery actions

## 🔒 Security Best Practices

- No sensitive data in logs (automatic redaction in production)
- Secure storage for tokens and user data
- Certificate pinning for API communication
- Jailbreak/root detection
- Code obfuscation in production builds

## 📱 Deep Linking

The app supports deep linking for:

- Authentication callbacks: `betthink://auth`
- Chat navigation: `betthink://chat/{chatId}`
- Bet details: `betthink://bet/{betId}`
- Settings: `betthink://settings`

## 🤝 Contributing

### Code Style

- Follow ESLint and Prettier configurations
- Use TypeScript strict mode
- Write tests for new features
- Update documentation

### Pull Request Process

1. Create feature branch from `develop`
2. Write tests and ensure coverage
3. Update README if needed
4. Submit PR with description
5. Await code review
6. Merge after approval

### Commit Convention

Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Build/config updates

## 📄 License

Copyright © 2024 Bet Think. All rights reserved.

## 🆘 Support

For issues or questions:
- GitHub Issues: [github.com/betthink/mobile/issues](https://github.com/betthink/mobile/issues)
- Email: support@betthink.com
- Documentation: [docs.betthink.com](https://docs.betthink.com)

## ⚠️ Responsible Gaming

Bet Think promotes responsible gambling. If you or someone you know has a gambling problem:
- Call: 1-800-GAMBLER
- Visit: [ncpgambling.org](https://ncpgambling.org)
- Use our in-app limits and self-exclusion features