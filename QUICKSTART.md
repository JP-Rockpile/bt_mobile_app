# Bet Think - Quick Start Guide

Get the Bet Think mobile app running in 5 minutes!

## Prerequisites

Install these first:
- [Node.js 18+](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- iOS Simulator (Mac only) or Android Emulator

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd bet-think

# Navigate to mobile app
cd apps/mobile

# Install dependencies
npm install
```

## Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Minimum required configuration:**
```env
APP_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=your-client-id
EXPO_PUBLIC_AUTH0_AUDIENCE=https://api.betthink.app
```

## Step 3: Run the App

```bash
# Start Expo dev server
npm start

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - Scan QR code with Expo Go app on your phone
```

## Step 4: Explore the App

The app will start on the authentication screen. To test:

1. **Without Auth0 configured**: The app will show the login screen but authentication will fail
2. **With Auth0 configured**: You can log in and explore all features

## Auth0 Setup (Optional for Testing)

If you want full functionality:

1. **Create Auth0 Account**: [auth0.com](https://auth0.com)
2. **Create Native Application**
3. **Configure Settings**:
   - Allowed Callback URLs: `betthink://callback`
   - Allowed Logout URLs: `betthink://`
   - Enable PKCE
4. **Copy credentials to `.env`**

## Testing Without Backend

The app includes:
- ✅ SQLite local storage (works offline)
- ✅ UI/UX fully functional
- ✅ Navigation and theming
- ⚠️ API calls will fail gracefully
- ⚠️ SSE streaming will show connection errors

## Running Tests

```bash
# Unit tests
npm test

# With coverage
npm run test:coverage

# Linting
npm run lint

# Type checking
npm run type-check
```

## Development Commands

```bash
npm start              # Start dev server
npm run ios            # Run on iOS
npm run android        # Run on Android
npm run web            # Run in browser
npm run lint           # Check code style
npm run lint:fix       # Fix code style
npm run format         # Format code
npm test               # Run tests
```

## Project Structure Overview

```
apps/mobile/
├── src/
│   ├── api/              # API client
│   ├── components/       # Reusable components
│   ├── config/           # Configuration
│   ├── hooks/            # Custom hooks
│   ├── navigation/       # React Navigation
│   ├── screens/          # Screen components
│   ├── services/         # Business logic
│   ├── stores/           # Zustand stores
│   ├── theme/            # Theming
│   └── utils/            # Utilities
├── App.tsx               # Entry point
├── app.config.ts         # Expo config
└── package.json          # Dependencies
```

## Key Files to Explore

1. **`App.tsx`** - App entry point with providers
2. **`src/navigation/RootNavigator.tsx`** - Navigation setup
3. **`src/screens/ChatScreen.tsx`** - Main chat interface
4. **`src/services/sse.service.ts`** - SSE streaming logic
5. **`src/components/BetConfirmationSheet.tsx`** - Betting UI

## Common Issues

### "Auth0 domain not configured"
**Solution**: Add Auth0 credentials to `.env`

### "Cannot connect to API"
**Expected**: Backend not implemented yet. App works offline with local storage.

### "Push notifications not working"
**Expected**: Only works on physical devices, not simulators

### Metro bundler cache issues
```bash
npm start -- --clear
```

## Next Steps

1. ✅ Explore the mobile app codebase
2. ⏳ Implement backend API (see `services/api/openapi.yaml`)
3. ⏳ Implement LLM service (see architecture docs)
4. ✅ Read full documentation in `apps/mobile/README.md`
5. ✅ Review architecture in `apps/mobile/ARCHITECTURE.md`

## Getting Help

- 📖 [Mobile App Documentation](./apps/mobile/README.md)
- 🏗️ [Architecture Guide](./apps/mobile/ARCHITECTURE.md)
- 🤝 [Contributing Guide](./CONTRIBUTING.md)
- 📊 [Project Summary](./PROJECT_SUMMARY.md)

## Production Build (When Ready)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --profile production --platform ios

# Build for Android
eas build --profile production --platform android
```

---

**Need help?** Check the full documentation or open an issue!

Happy coding! 🚀
