# Bet Think Mobile - Architecture Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Bet Think Mobile App                     │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │    Auth    │  │    Chat    │  │  Betting   │           │
│  │   Screen   │  │   Screen   │  │  History   │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│         │              │                │                   │
│         └──────────────┴────────────────┘                   │
│                        │                                    │
│              ┌─────────▼─────────┐                         │
│              │   React Navigation │                         │
│              └─────────┬─────────┘                         │
│                        │                                    │
│         ┌──────────────┴──────────────┐                    │
│         │                              │                    │
│    ┌────▼────┐                   ┌────▼────┐              │
│    │ Zustand │                   │  React  │              │
│    │  State  │                   │  Query  │              │
│    └────┬────┘                   └────┬────┘              │
│         │                              │                    │
│         └──────────────┬───────────────┘                    │
│                        │                                    │
│              ┌─────────▼─────────┐                         │
│              │     Services       │                         │
│              │  ┌──────────────┐ │                         │
│              │  │  Auth Service │ │                         │
│              │  │  SSE Service  │ │                         │
│              │  │  DB Service   │ │                         │
│              │  │  Notification │ │                         │
│              │  │  Analytics    │ │                         │
│              │  └──────────────┘ │                         │
│              └─────────┬─────────┘                         │
│                        │                                    │
│         ┌──────────────┴──────────────┐                    │
│         │                              │                    │
│    ┌────▼────┐                   ┌────▼────┐              │
│    │  SQLite │                   │   API   │              │
│    │Database │                   │ Client  │              │
│    └─────────┘                   └────┬────┘              │
└────────────────────────────────────────│───────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                          │
              ┌─────▼─────┐                           ┌───────▼──────┐
              │ services/ │                           │  services/   │
              │    api    │──────SSE Stream──────────▶│    model     │
              └───────────┘                           └──────────────┘
                    │
                    │ REST API
                    │
              ┌─────▼─────┐
              │ packages/ │
              │  shared   │
              └───────────┘
```

## Data Flow

### Authentication Flow

1. User taps "Sign In"
2. Auth0 Universal Login opens (PKCE flow)
3. User authenticates with Auth0
4. Tokens returned and stored in SecureStore
5. User info fetched and stored in Zustand
6. Auto token refresh scheduled

### Chat Message Flow

1. User types message and taps send
2. **Optimistic Update**: Message saved to SQLite with `synced: false`
3. UI immediately displays user message
4. API request sent with message content
5. On success: Message marked as synced in SQLite
6. SSE connection established for streaming response
7. Stream chunks received and displayed in real-time
8. On completion: Assistant message saved to SQLite
9. React Query cache invalidated to refresh UI

### Betting Flow

1. Assistant message contains bet recommendation
2. User taps "View Recommendation"
3. Bottom sheet opens with bet details
4. User reviews and taps "Confirm & Open"
5. Confirmation saved to API
6. Deep link constructed with bet parameters
7. Sportsbook app opens in guide mode
8. Analytics event tracked
9. User returns to app via deep link

### SSE Streaming Flow

```
Client                          API                          Model
  │                              │                             │
  ├──────GET /stream/────────────▶                             │
  │      (with auth token)       │                             │
  │                              ├────────Inference────────────▶
  │                              │                             │
  │◀──────Stream Chunk 1─────────┤◀───────Token 1──────────────┤
  │◀──────Stream Chunk 2─────────┤◀───────Token 2──────────────┤
  │◀──────Stream Chunk N─────────┤◀───────Token N──────────────┤
  │◀──────Done Event─────────────┤◀───────Complete─────────────┤
  │                              │                             │
```

**Reconnection Logic:**
- Connection lost → Wait 1s → Retry
- Retry 1 fails → Wait 2s → Retry
- Retry 2 fails → Wait 4s → Retry
- Max 5 retries with exponential backoff
- After max retries → Display error to user

### Local-First Sync Strategy

```
┌─────────────────────────────────────────┐
│           Write Operation               │
└───────────────┬─────────────────────────┘
                │
        ┌───────▼────────┐
        │ Write to SQLite│
        │ (optimistic)   │
        └───────┬────────┘
                │
        ┌───────▼────────┐
        │ Update UI      │
        │ immediately    │
        └───────┬────────┘
                │
        ┌───────▼────────┐
        │ Sync to API    │
        │ (background)   │
        └───────┬────────┘
                │
        ┌───────▼────────┐
     ┌──│   Success?     │──┐
     │  └────────────────┘  │
     │                      │
  Yes│                   No│
     │                      │
     ▼                      ▼
┌──────────┐         ┌──────────┐
│Mark synced│        │ Queue for│
│in SQLite  │        │later sync│
└───────────┘        └──────────┘
```

## State Management

### Zustand Stores

**authStore**
- Current user
- Tokens (reference only, actual tokens in SecureStore)
- Authentication status
- Login/logout actions

**chatStore**
- Active thread ID
- Stream state (streaming, buffer, errors)
- Per-thread stream buffers

**uiStore**
- Theme preference (light/dark/system)
- Effective theme
- Bottom sheet state
- Bottom sheet content/data

### React Query Cache

- Chat threads (stale: 1min)
- Chat messages (stale: 30s)
- Bet recommendations (stale: 5min)
- Bet history (stale: 5min)
- User profile (stale: 15min)

### SQLite Schema

```sql
CREATE TABLE chat_threads (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lastMessageAt TEXT,
  messageCount INTEGER DEFAULT 0,
  synced INTEGER DEFAULT 1
);

CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  localId TEXT UNIQUE NOT NULL,
  chatId TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  metadata TEXT,
  synced INTEGER DEFAULT 0,
  optimistic INTEGER DEFAULT 0,
  FOREIGN KEY (chatId) REFERENCES chat_threads(id) ON DELETE CASCADE
);
```

## Navigation Structure

```
RootNavigator
├── Auth (not authenticated)
│   └── AuthScreen
└── Main (authenticated)
    ├── MainNavigator (Bottom Tabs)
    │   ├── Home
    │   │   └── HomeScreen (Chat list)
    │   ├── History
    │   │   └── HistoryScreen (Bet history)
    │   └── Settings
    │       └── SettingsScreen
    └── ChatDetail (Stack)
        └── ChatScreen
```

## Deep Linking

### Supported URLs

- `betthink://chat/:threadId` - Open specific chat
- `https://betthink.app/chat/:threadId` - Universal link
- `betthink://auth/callback` - Auth0 callback
- Sportsbook deep links (outbound):
  - `draftkings://bet?mode=guide&...`
  - `fanduel://bet?mode=guide&...`

### Return Flow

1. User confirms bet in mobile app
2. Deep link opens sportsbook app
3. User places bet in sportsbook
4. Sportsbook app can deep link back: `betthink://chat/:threadId?bet_placed=true`
5. App resumes with context preserved

## Security Architecture

### Token Storage

```
┌──────────────────────────────────────┐
│         Expo SecureStore API         │
│  ┌────────────────────────────────┐  │
│  │  iOS: Keychain                 │  │
│  │  Android: EncryptedSharedPrefs │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
         ▲
         │ Store/Retrieve tokens
         │
┌────────┴─────────┐
│   Auth Service   │
│  ┌────────────┐  │
│  │ getTokens  │  │
│  │ setTokens  │  │
│  │ refresh    │  │
│  └────────────┘  │
└──────────────────┘
```

### API Request Flow

```
Component
   │
   ▼
React Query
   │
   ▼
API Client (Axios)
   │
   ├──[Interceptor: Add Auth Token]──────┐
   │                                      │
   ▼                                      ▼
Make Request                        Auth Service
   │                                      │
   ▼                                      ▼
Response                           Get Valid Token
   │                                      │
   ├──[Interceptor: Handle 401]──────────┘
   │    If 401: Refresh token & retry
   ▼
Return to Component
```

## Performance Optimizations

### Rendering Optimizations

- `React.memo` on expensive components
- `useMemo` for computed values
- `useCallback` for stable function references
- Virtualized lists (FlatList) for chat/history
- Lazy loading for screens

### Network Optimizations

- Request deduplication (React Query)
- Stale-while-revalidate caching
- Optimistic updates
- Background refetch on reconnect
- Request batching where possible

### Storage Optimizations

- SQLite indexes on frequently queried columns
- Lazy loading of message history
- Periodic cleanup of old data
- Efficient query patterns

### Bundle Optimization

- Code splitting per screen
- Tree shaking
- Hermes engine (Android)
- Production builds minified

## Error Handling

### Error Boundary Hierarchy

```
App
└── ErrorBoundary (Root)
    └── QueryClientProvider
        └── RootNavigator
            └── ErrorBoundary (Screen-level, optional)
                └── Screen Components
```

### Error Types

1. **Network Errors**: Retry with exponential backoff
2. **Auth Errors**: Force re-login
3. **Validation Errors**: Display to user
4. **Unknown Errors**: Capture in Sentry, show generic message

### Fallback Behaviors

- **API Offline**: Use cached/local data
- **SSE Stream Fails**: Show error, allow manual retry
- **Deep Link Fails**: Show app store link
- **Push Notification Fails**: Degrade gracefully

## Monitoring & Observability

### Amplitude Events

Track user journeys, feature usage, conversion funnels

### Sentry Integration

- Crash reports
- Error tracking
- Performance monitoring
- Release tracking
- Breadcrumbs for context

### Logs

- Console logs in development
- Filtered logs in production (warn/error only)
- Sensitive data redaction
- Structured logging format

## Scalability Considerations

### Current Limits

- SQLite: Efficient up to 100K messages
- React Query cache: 100MB typical
- SSE connections: 1 active per chat

### Future Improvements

- Pagination for large chat histories
- Message archival to backend
- Multiple simultaneous streams
- Offline queue with IndexedDB fallback
- Background sync worker

## Deployment Architecture

```
┌────────────────────────────────────────┐
│          EAS Build Service             │
│  ┌──────────────────────────────────┐  │
│  │  Build iOS (Xcode Cloud)         │  │
│  │  Build Android (Google Cloud)    │  │
│  └──────────────────────────────────┘  │
└───────────────┬────────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│         App Store / Play Store        │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│          User Devices                 │
│  ┌─────────────────────────────────┐  │
│  │  Base App (from store)          │  │
│  │  + OTA Updates (from EAS)       │  │
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

### Update Strategy

- **Major updates**: App store releases
- **Minor fixes/features**: OTA updates
- **Rollback**: Revert OTA channel to previous
- **Staged rollout**: Dev → Staging → Prod

---

**Last Updated**: 2025-09-30
