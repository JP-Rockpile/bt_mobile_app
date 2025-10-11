# Bet Think - Mobile App Repository

A production-ready React Native mobile application for Bet Think, a sports betting chat assistant. This repository contains the mobile client and shared utilities. The backend API is maintained in a separate repository.

## 🏗️ Project Structure

```
bt_mobile_app/
├── apps/
│   └── mobile/              # React Native mobile app (Expo + TypeScript)
├── packages/
│   └── shared/              # Shared types, schemas, and utilities
├── docs/
│   ├── api/                 # API documentation and OpenAPI spec
│   └── API_INTEGRATION.md   # Guide for connecting to backend API
└── README.md                # This file
```

**Note**: The backend API is maintained in a separate repository. See [API Integration Guide](./docs/API_INTEGRATION.md) for setup instructions.

## 📱 Mobile App

Production-ready React Native mobile application built with:

- **Framework**: Expo SDK 51, TypeScript
- **Authentication**: Auth0 Universal Login with PKCE
- **State Management**: React Query + Zustand
- **UI Library**: React Native Paper (Material Design 3)
- **Navigation**: React Navigation v6+
- **Local Storage**: SQLite (expo-sqlite)
- **Push Notifications**: Expo Notifications
- **Analytics**: Amplitude
- **Error Tracking**: Sentry
- **Deep Linking**: Universal links + custom schemes
- **OTA Updates**: EAS Updates
- **Testing**: Jest, React Native Testing Library, Detox

### Key Features

✅ Secure authentication with token refresh  
✅ Real-time SSE streaming for LLM responses  
✅ Conversational betting flow with bottom sheet UI  
✅ Deep linking to sportsbook apps (guide mode)  
✅ Local-first architecture with SQLite  
✅ Optimistic UI updates with conflict resolution  
✅ Push notifications with deep linking  
✅ Comprehensive analytics and error tracking  
✅ Light/dark theme with system detection  
✅ Full accessibility support  
✅ Production-ready builds and OTA updates  

[→ See Mobile App Documentation](./apps/mobile/README.md)

## 📦 Shared Package

TypeScript package with shared types, Zod schemas, and utility functions used across services:

- **Types**: User, Chat, Betting, Notifications, API responses
- **Schemas**: Zod validation schemas
- **Utils**: Date formatting, odds conversion, validation helpers

```typescript
import { BetRecommendation, betRecommendationSchema } from '@bet-think/shared';
```

## 🚀 Getting Started

**👉 [See QUICKSTART.md for a 5-minute setup guide](./QUICKSTART.md)**

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli` (optional, for production builds)

### Quick Start - Mobile App

```bash
# Install dependencies
cd apps/mobile
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android     
npm run android
```

**Note**: The mobile app works offline with local storage. Ensure your backend API (separate repository) is running for full functionality. See [API Integration Guide](./docs/API_INTEGRATION.md) for setup.

### Quick Start - Shared Package

```bash
cd packages/shared
npm install
npm run type-check
```

## 🏗️ Architecture

This repository contains the **mobile client application**. The backend API and LLM services are maintained in a separate repository.

### Backend API (Separate Repository)

**Responsibilities**:
- REST API endpoints for chat, betting, user management
- SSE streaming endpoints for LLM responses
- Authentication middleware (Auth0 token validation)
- Database integration
- Push notification dispatch
- Rate limiting and security

**Key Endpoints**:
```
POST   /api/auth/register
GET    /api/users/me
GET    /api/chat/threads
POST   /api/chat/threads
GET    /api/chat/threads/:id/messages
POST   /api/chat/threads/:id/messages
GET    /api/chat/threads/:id/stream          # SSE
GET    /api/bets/recommendations/:id
POST   /api/bets/confirmations
GET    /api/bets/history
POST   /api/notifications/devices
GET    /api/notifications
```

**Full API specification**: See `docs/api/openapi.yaml`

**Integration Guide**: See [API Integration Guide](./docs/API_INTEGRATION.md) for detailed setup instructions.

## 🔐 Authentication Flow

```
Mobile App → Auth0 Universal Login (PKCE)
          ↓
    Access Token + Refresh Token
          ↓
    Stored in Expo SecureStore
          ↓
    API Requests (Bearer token)
          ↓
    Backend validates with Auth0
```

## 🔄 Data Flow

### Chat Message Flow

```
User types message
       ↓
Optimistic update (SQLite)
       ↓
POST /api/chat/threads/:id/messages
       ↓
GET /api/chat/threads/:id/stream (SSE)
       ↓
services/model inference
       ↓
Stream chunks back to mobile
       ↓
Display in real-time
       ↓
Save complete message (SQLite)
```

### Betting Flow

```
LLM recommends bet
       ↓
Display in chat message
       ↓
User taps recommendation
       ↓
Bottom sheet shows details
       ↓
User confirms
       ↓
POST /api/bets/confirmations
       ↓
Deep link opens sportsbook app
       ↓
User places bet manually
       ↓
(Optional) Return to app
```

## 📊 API Schema

The complete OpenAPI 3.0 specification is available at:
```
docs/api/openapi.yaml
```

This specification defines all endpoints, request/response schemas, and authentication requirements that the backend API should implement.

The mobile app includes a pre-built typed API client in `apps/mobile/src/api/` that follows this specification.

## 🧪 Testing

### Mobile App

```bash
cd apps/mobile

# Unit tests
npm test

# E2E tests
npm run test:e2e:build:ios
npm run test:e2e
```

### API (Separate Repository)

See your backend API repository for testing instructions.

## 🚀 Deployment

### Mobile App

```bash
cd apps/mobile

# Build for app stores
eas build --profile production --platform all

# Deploy OTA update
eas update --branch production --message "Bug fixes"
```

### Backend API (Separate Repository)

See your backend API repository for deployment instructions.

## 📈 Monitoring

- **Mobile**: Sentry (crashes), Amplitude (analytics)
- **API**: Datadog/New Relic, Sentry
- **Model**: Prometheus + Grafana

## 🔒 Security Checklist

- [x] Auth0 PKCE flow for mobile
- [x] Secure token storage (Keychain/Keystore)
- [x] Automatic token refresh
- [x] HTTPS only
- [x] Sensitive data redaction in logs
- [ ] API rate limiting (implement in backend API repo)
- [ ] Input validation (implement in backend API repo)
- [ ] SQL injection prevention (implement in backend API repo)
- [ ] CORS configuration (implement in backend API repo)

## 🎯 What's Included

### ✅ Fully Implemented (Production-Ready)

**Mobile App (`apps/mobile/`):**
- Complete React Native app with Expo
- All 14 requirements fully implemented
- 80+ files, ~15,000 lines of TypeScript
- Comprehensive tests and documentation
- Ready for App Store submission

**Shared Package (`packages/shared/`):**
- TypeScript types and Zod schemas
- Utility functions
- Can be shared with backend API if needed

**Documentation:**
- Architecture diagrams
- API specifications (OpenAPI 3.0)
- API integration guide
- Contributing guidelines
- Deployment guides

### 📝 Backend API (Separate Repository)

The backend API should be implemented in a separate repository following the OpenAPI specification in `docs/api/openapi.yaml`.

**Requirements**:
- Implement endpoints per OpenAPI spec
- Auth0 token validation
- PostgreSQL or similar database
- SSE streaming for LLM responses
- Push notification dispatch

## 📝 Environment Variables

### Mobile App

See `apps/mobile/.env.example`

### Backend API Service (Separate Repository)

See your backend API repository for environment variable configuration.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📚 Documentation

- 📖 [Quick Start Guide (5 min)](./QUICKSTART.md)
- 🔌 [API Integration Guide](./docs/API_INTEGRATION.md) ⭐ **Start here for API setup**
- 📁 [Complete File Index](./FILE_INDEX.md)
- 📊 [Project Summary](./PROJECT_SUMMARY.md)
- 📱 [Mobile App Docs](./apps/mobile/README.md)
- 🏗️ [Architecture Guide](./apps/mobile/ARCHITECTURE.md)
- 📋 [OpenAPI Specification](./docs/api/openapi.yaml)

## 📄 License

Proprietary - All rights reserved

## 👥 Support

For questions or issues, contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2025-09-30
