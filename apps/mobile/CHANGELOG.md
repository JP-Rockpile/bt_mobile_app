# Changelog

All notable changes to the Bet Think mobile app will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-09-30

### Added

#### Authentication
- Auth0 Universal Login with PKCE flow
- Secure token storage using Expo SecureStore
- Automatic token refresh with 5-minute buffer
- Session persistence across app restarts

#### Chat Interface
- Real-time SSE streaming for LLM responses
- Optimistic UI updates for instant feedback
- Automatic reconnection with exponential backoff
- Local-first SQLite storage for chat history
- Offline support with background sync

#### Betting Flow
- Conversational betting recommendations
- Bottom sheet UI for bet confirmation
- Deep linking to sportsbook apps in guide mode
- Bet history tracking
- Analytics for all betting actions

#### Push Notifications
- Expo push notifications integration
- Foreground and background handling
- Deep linking from notifications
- Device token registration with backend
- Android notification channels

#### State Management
- React Query for server state
- Zustand for client state (auth, chat, UI)
- SQLite for persistent local storage

#### UI/UX
- React Native Paper Material Design 3
- Light and dark theme support
- System theme detection
- Fully accessible with ARIA labels
- Smooth animations and transitions

#### Navigation
- React Navigation v6 with type safety
- Bottom tab navigation (Chats, Bets, Settings)
- Deep linking support
- Universal links configuration

#### Analytics & Monitoring
- Amplitude analytics integration
- Sentry error tracking and crash reporting
- Structured logging with redaction
- Performance monitoring

#### Build & Deploy
- EAS Build configuration for iOS/Android
- Three environments: dev, staging, production
- OTA updates with channel management
- Source maps for production debugging

#### Testing
- Jest for unit tests
- React Native Testing Library for components
- Detox for E2E tests
- Test coverage reporting

#### Documentation
- Comprehensive README
- Architecture documentation
- API integration guide
- Testing guide
- Contributing guidelines

### Security
- PKCE authentication flow
- Secure token storage (Keychain/Keystore)
- Sensitive data redaction in logs
- HTTPS-only communication
- Input validation with Zod schemas

### Performance
- Virtualized lists for chat/history
- Memoized components
- Optimistic updates
- Background data sync
- Efficient SQLite queries

---

## [Unreleased]

### Planned Features
- Multi-language support (i18n)
- Voice input for chat messages
- Chat message search
- Export bet history
- In-app bet tracking (after placement)
- Biometric authentication
- Custom push notification sounds
- Dark mode scheduling
- Chat thread folders/tags

### Known Issues
- None at launch

---

**Version Format**: MAJOR.MINOR.PATCH
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)
