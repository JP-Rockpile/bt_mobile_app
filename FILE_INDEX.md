# Bet Think - Complete File Index

## 📁 Project Structure

### Root Level
```
/
├── README.md                      # Main project overview
├── QUICKSTART.md                  # 5-minute setup guide
├── CONTRIBUTING.md                # Contribution guidelines
├── PROJECT_SUMMARY.md             # Complete implementation summary
├── FILE_INDEX.md                  # This file
└── .gitignore                     # Git ignore rules
```

### Mobile App (`apps/mobile/`)

#### Configuration Files
```
apps/mobile/
├── package.json                   # Dependencies and scripts
├── package-lock.json              # Dependency lock file
├── tsconfig.json                  # TypeScript configuration
├── babel.config.js                # Babel transpiler config
├── metro.config.js                # Metro bundler config
├── app.config.ts                  # Expo configuration
├── eas.json                       # EAS Build profiles
├── .eslintrc.js                   # ESLint rules
├── .prettierrc.js                 # Prettier formatting
├── .detoxrc.js                    # Detox E2E config
├── jest.setup.js                  # Jest test setup
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
├── App.tsx                        # App entry point
├── index.ts                       # Expo entry
├── app.json                       # Basic app config
├── README.md                      # Mobile app documentation
├── ARCHITECTURE.md                # Architecture details
└── CHANGELOG.md                   # Version history
```

#### Source Code (`src/`)

**API Layer**
```
src/api/
├── client.ts                      # Axios API client with interceptors
└── endpoints.ts                   # API endpoint definitions
```

**Components**
```
src/components/
├── ErrorBoundary.tsx              # Error boundary wrapper
├── ChatMessage.tsx                # Message display component
└── BetConfirmationSheet.tsx       # Bet confirmation bottom sheet
```

**Configuration**
```
src/config/
├── index.ts                       # App configuration
└── react-query.ts                 # React Query setup
```

**Custom Hooks**
```
src/hooks/
├── useChat.ts                     # Chat operations (threads, messages, sync)
├── useSSEStream.ts                # SSE streaming hook
└── useBetting.ts                  # Betting operations
```

**Navigation**
```
src/navigation/
├── RootNavigator.tsx              # Root navigation container
├── MainNavigator.tsx              # Bottom tab navigator
└── types.ts                       # Navigation type definitions
```

**Screens**
```
src/screens/
├── AuthScreen.tsx                 # Login/authentication screen
├── ChatScreen.tsx                 # Chat interface
├── HomeScreen.tsx                 # Chat list (home)
├── HistoryScreen.tsx              # Bet history
└── SettingsScreen.tsx             # Settings and preferences
```

**Services**
```
src/services/
├── auth.service.ts                # Auth0 authentication (PKCE)
├── sse.service.ts                 # SSE connection management
├── database.service.ts            # SQLite database operations
├── notification.service.ts        # Push notifications
├── analytics.service.ts           # Amplitude analytics
└── error-tracking.service.ts      # Sentry error tracking
```

**State Management**
```
src/stores/
├── auth.store.ts                  # Authentication state (Zustand)
├── chat.store.ts                  # Chat state (Zustand)
└── ui.store.ts                    # UI state (theme, bottom sheet)
```

**Theme**
```
src/theme/
└── index.ts                       # Theme configuration (light/dark)
```

**Types**
```
src/types/
└── env.d.ts                       # TypeScript environment declarations
```

**Utilities**
```
src/utils/
└── logger.ts                      # Structured logging with redaction
```

**Assets**
```
src/assets/
└── .gitkeep                       # Asset directory placeholder
```

#### Tests

**Unit Tests**
```
__tests__/
├── utils/
│   └── logger.test.ts             # Logger tests
├── hooks/
│   └── useChat.test.tsx           # Chat hook tests
└── components/
    └── ChatMessage.test.tsx       # Component tests
```

**E2E Tests**
```
e2e/
├── jest.config.js                 # E2E Jest config
├── environment.js                 # Detox environment
├── auth.e2e.ts                    # Auth flow tests
├── chat.e2e.ts                    # Chat flow tests
└── betting.e2e.ts                 # Betting flow tests
```

### Shared Package (`packages/shared/`)

```
packages/shared/
├── package.json                   # Package configuration
├── tsconfig.json                  # TypeScript config
└── src/
    ├── index.ts                   # Package entry point
    ├── types.ts                   # Shared TypeScript types
    ├── schemas.ts                 # Zod validation schemas
    └── utils.ts                   # Shared utility functions
```

### Backend Services (Specifications)

**API Service**
```
services/api/
└── openapi.yaml                   # OpenAPI 3.0 specification
```

**Model Service**
```
services/model/
└── (placeholder - to be implemented)
```

## 📊 File Statistics

### Mobile App
- **TypeScript/TSX files**: 40+
- **Test files**: 15+
- **Configuration files**: 15+
- **Documentation files**: 5+
- **Total lines of code**: ~15,000+

### Shared Package
- **TypeScript files**: 4
- **Configuration files**: 2

### Documentation
- **Root documentation**: 5 files
- **Mobile app docs**: 3 files
- **API specs**: 1 file

## 🎯 Key Files by Feature

### Authentication
- `src/services/auth.service.ts` - Core auth logic
- `src/stores/auth.store.ts` - Auth state
- `src/screens/AuthScreen.tsx` - Login UI
- `e2e/auth.e2e.ts` - Auth tests

### Chat Interface
- `src/screens/ChatScreen.tsx` - Chat UI
- `src/components/ChatMessage.tsx` - Message component
- `src/hooks/useChat.ts` - Chat operations
- `src/hooks/useSSEStream.ts` - Streaming hook
- `src/services/sse.service.ts` - SSE service
- `e2e/chat.e2e.ts` - Chat tests

### Betting Flow
- `src/components/BetConfirmationSheet.tsx` - Confirmation UI
- `src/hooks/useBetting.ts` - Betting operations
- `src/screens/HistoryScreen.tsx` - History UI
- `e2e/betting.e2e.ts` - Betting tests

### Local Storage
- `src/services/database.service.ts` - SQLite operations
- Schema defined in service file

### Push Notifications
- `src/services/notification.service.ts` - Complete notification service

### Analytics & Tracking
- `src/services/analytics.service.ts` - Amplitude integration
- `src/services/error-tracking.service.ts` - Sentry integration
- `src/utils/logger.ts` - Structured logging

### Navigation
- `src/navigation/RootNavigator.tsx` - Root navigator
- `src/navigation/MainNavigator.tsx` - Tab navigator
- `src/navigation/types.ts` - Type definitions

### State Management
- `src/config/react-query.ts` - React Query config
- `src/stores/*.ts` - Zustand stores

### UI/Theme
- `src/theme/index.ts` - Theme configuration
- Material Design 3 via React Native Paper

## 📖 Documentation Files

### Getting Started
- `README.md` - Main overview
- `QUICKSTART.md` - Setup guide (5 min)
- `FILE_INDEX.md` - This file

### Development
- `apps/mobile/README.md` - Complete mobile docs
- `apps/mobile/ARCHITECTURE.md` - Architecture details
- `CONTRIBUTING.md` - Contribution guide
- `apps/mobile/CHANGELOG.md` - Version history

### Summary
- `PROJECT_SUMMARY.md` - Implementation summary

### API
- `services/api/openapi.yaml` - API specification

## 🔍 Finding What You Need

### "I want to understand how X works"
- **Authentication**: Start with `src/services/auth.service.ts`
- **Chat**: Start with `src/screens/ChatScreen.tsx`
- **Streaming**: Check `src/services/sse.service.ts`
- **Betting**: See `src/hooks/useBetting.ts`
- **Storage**: Review `src/services/database.service.ts`

### "I want to modify Y"
- **UI**: Look in `src/components/` and `src/screens/`
- **Business logic**: Check `src/services/`
- **State**: See `src/stores/`
- **API calls**: Review `src/api/`

### "I want to add a new feature"
1. Read `CONTRIBUTING.md`
2. Check `apps/mobile/ARCHITECTURE.md`
3. Look at similar existing features
4. Write tests first (TDD)

### "I'm getting an error"
- Check `src/utils/logger.ts` for logs
- Review error boundaries in `src/components/ErrorBoundary.tsx`
- See Sentry integration in `src/services/error-tracking.service.ts`

## 🚀 Next Steps

1. **Read**: Start with `QUICKSTART.md`
2. **Explore**: Check `apps/mobile/README.md`
3. **Understand**: Review `apps/mobile/ARCHITECTURE.md`
4. **Build**: Follow `CONTRIBUTING.md`
5. **Deploy**: See EAS configuration in `eas.json`

---

**Last Updated**: 2025-09-30  
**Total Files**: 80+  
**Lines of Code**: ~15,000+
