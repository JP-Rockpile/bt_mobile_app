# API Integration Guide

This document describes how to connect the Bet Think mobile app to your backend API (separate repository).

## Overview

The Bet Think mobile app is designed to work with a separate backend API service. The mobile app handles:
- User interface and interactions
- Local data persistence (SQLite)
- Offline capabilities
- Push notifications (client-side)
- Analytics and error tracking

The backend API (in a separate repo) handles:
- REST API endpoints
- SSE (Server-Sent Events) streaming for real-time LLM responses
- Authentication validation (Auth0)
- Database operations (user data, chat history, bets)
- LLM integration for chat responses
- Push notification dispatch

## Architecture

```
┌─────────────────────┐
│   Mobile App        │
│  (This Repo)        │
│                     │
│  - React Native     │
│  - Local SQLite     │
│  - API Client       │
└──────────┬──────────┘
           │
           │ HTTPS/WSS
           │
┌──────────▼──────────┐
│   Backend API       │
│  (Separate Repo)    │
│                     │
│  - REST Endpoints   │
│  - SSE Streaming    │
│  - Auth Validation  │
│  - Database         │
└──────────┬──────────┘
           │
           │
┌──────────▼──────────┐
│   LLM Service       │
│                     │
│  - LLM Integration  │
│  - Inference        │
│  - Streaming        │
└─────────────────────┘
```

## API Specification

The complete API specification is available in OpenAPI 3.0 format at:
```
docs/api/openapi.yaml
```

**Note**: This file uses the OpenAPI specification format (formerly known as Swagger) to document our custom Bet Think API. It is not related to OpenAI (the AI company).

This spec defines all endpoints, request/response schemas, and authentication requirements.

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `GET /api/users/me` - Get current user profile

#### Chat
- `GET /api/chat/threads` - List chat threads
- `POST /api/chat/threads` - Create new thread
- `GET /api/chat/threads/:id/messages` - Get messages
- `POST /api/chat/threads/:id/messages` - Send message
- `GET /api/chat/threads/:id/stream` - SSE stream for LLM responses

#### Betting
- `GET /api/bets/recommendations/:id` - Get bet recommendation
- `POST /api/bets/confirmations` - Confirm bet
- `GET /api/bets/history` - Get bet history

#### Notifications
- `POST /api/notifications/devices` - Register device for push
- `DELETE /api/notifications/devices/:id` - Unregister device
- `GET /api/notifications` - Get notifications

## Configuration

### 1. Environment Setup

Copy the example environment file:

```bash
cd apps/mobile
cp .env.example .env
```

### 2. Configure API URL

Edit `.env` and set your API URL:

```env
# For local development
EXPO_PUBLIC_API_URL=http://localhost:3000

# For staging
EXPO_PUBLIC_API_URL=https://staging-api.betthink.app

# For production
EXPO_PUBLIC_API_URL=https://api.betthink.app
```

**Important**: 
- Use `http://localhost:3000` for local API development
- On iOS simulator, `localhost` works fine
- On Android emulator, you may need to use `http://10.0.2.2:3000`
- On physical devices, use your computer's local IP (e.g., `http://192.168.1.100:3000`)

### 3. Configure Auth0

The mobile app and backend API must share the same Auth0 configuration:

```env
EXPO_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=your-mobile-client-id
EXPO_PUBLIC_AUTH0_AUDIENCE=https://api.betthink.app
```

**Backend API must**:
- Use the same Auth0 tenant
- Validate tokens against the same audience
- Accept the issuer: `https://your-tenant.auth0.com/`

### 4. CORS Configuration

Your backend API must allow CORS requests from the mobile app:

```javascript
// Example for Express.js
app.use(cors({
  origin: [
    'http://localhost:8081', // Expo dev server
    'exp://*',               // Expo Go app
    'betthink://*',          // Production app
  ],
  credentials: true,
}));
```

## Mobile App API Client

The mobile app includes a pre-configured API client with:

### Features

✅ **Automatic Token Management**
- Adds Bearer token to all requests
- Refreshes tokens automatically on 401
- Queues requests during token refresh

✅ **Error Handling**
- Normalized error responses
- Network error detection
- Retry logic for failed requests

✅ **Request/Response Logging**
- Debug logging in development
- Sanitized logs in production
- API error tracking

### Usage Example

```typescript
import { chatApi } from '@/api/endpoints';

// Get chat threads
const threads = await chatApi.getThreads({ page: 1, pageSize: 50 });

// Send a message
const message = await chatApi.sendMessage(threadId, 'Tell me about NBA bets');

// Get SSE stream URL for real-time responses
const streamUrl = chatApi.getStreamUrl(threadId);
```

### API Client Structure

```
apps/mobile/src/api/
├── client.ts      # Axios instance with interceptors
└── endpoints.ts   # Typed endpoint functions
```

## SSE Streaming

The mobile app supports Server-Sent Events (SSE) for real-time LLM responses.

### Backend Requirements

Your API should implement SSE at:
```
GET /api/chat/threads/:threadId/stream
```

**Event Format**:
```
event: token
data: {"content": "word"}

event: token
data: {"content": " another"}

event: done
data: {"messageId": "uuid", "fullContent": "complete message"}
```

### Mobile Implementation

The mobile app automatically:
1. Establishes SSE connection when needed
2. Displays streaming tokens in real-time
3. Handles reconnection (exponential backoff, max 5 retries)
4. Gracefully handles connection failures

## Authentication Flow

```
1. User opens app
   ↓
2. App checks for valid token (Expo SecureStore)
   ↓
3a. Token valid → Proceed to app
3b. Token missing/expired → Show auth screen
   ↓
4. User taps "Sign In"
   ↓
5. Auth0 Universal Login (PKCE flow)
   ↓
6. Tokens returned to app
   ↓
7. Tokens stored in SecureStore
   ↓
8. API Client adds Bearer token to requests
   ↓
9. Backend validates token with Auth0
```

### Token Refresh

The mobile app automatically refreshes tokens:
- When token expires (checked before each request)
- 5 minutes before expiration (proactive)
- On 401 response from API
- Queues all requests during refresh

## Local Development Setup

### Running Both Repos Together

#### Terminal 1: Backend API
```bash
cd /path/to/your/api-repo
npm install
npm run dev  # Should start on port 3000
```

#### Terminal 2: Mobile App
```bash
cd /path/to/bt_mobile_app/apps/mobile
npm install
cp .env.example .env
# Edit .env with API_URL=http://localhost:3000
npm start
```

#### Terminal 3: Run on Device/Simulator
```bash
# iOS
npm run ios

# Android
npm run android
```

### Testing API Connection

1. **Check API is running**:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check Auth0 configuration**:
   - Verify callback URLs in Auth0 dashboard
   - Ensure API has Auth0 middleware configured
   - Test token validation

3. **Test an endpoint**:
   ```bash
   # Get access token from Auth0
   TOKEN="your-token-here"
   
   curl -H "Authorization: Bearer $TOKEN" \
        http://localhost:3000/api/users/me
   ```

## Deployment

### Mobile App Configuration

Use different `.env` files or EAS Secrets for each environment:

```bash
# Development
EXPO_PUBLIC_API_URL=http://localhost:3000

# Staging
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://staging-api.betthink.app"

# Production
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.betthink.app"
```

### Backend API Deployment

Your backend API should be deployed to a reliable platform:

**Recommended Platforms**:
- **AWS ECS/Fargate**: Containerized, scalable
- **Google Cloud Run**: Serverless containers
- **Railway**: Simple deployment
- **Render**: Easy setup
- **Fly.io**: Edge deployment

**Requirements**:
- HTTPS enabled (required for mobile apps)
- Health check endpoint (`/api/health`)
- Monitoring and logging
- Auto-scaling for traffic spikes
- Database with backups

## Troubleshooting

### Mobile app can't connect to API

**On iOS Simulator**:
```bash
# Check API is accessible
curl http://localhost:3000/api/health

# If not, check API is running
# Check .env has correct URL
```

**On Android Emulator**:
```bash
# Try using Android's special IP
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000

# Or your computer's IP
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

**On Physical Device**:
```bash
# Use your computer's local IP
# Find it with: ifconfig (Mac/Linux) or ipconfig (Windows)
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000

# Make sure device is on same WiFi network
```

### Authentication failing

1. **Check Auth0 configuration matches**:
   - Mobile app `.env` has correct domain/clientId
   - Backend API has same audience configured
   - Callback URLs include mobile app schemes

2. **Check token validation**:
   - Backend API validates Auth0 JWT properly
   - Issuer matches: `https://your-tenant.auth0.com/`
   - Audience matches your API identifier

3. **Check token expiration**:
   - Tokens expire after 24 hours by default
   - Mobile app should auto-refresh
   - Check refresh token is being stored

### SSE streaming not working

1. **Check endpoint**:
   ```bash
   curl -N -H "Authorization: Bearer $TOKEN" \
        http://localhost:3000/api/chat/threads/THREAD_ID/stream
   ```

2. **Check API sends correct headers**:
   ```
   Content-Type: text/event-stream
   Cache-Control: no-cache
   Connection: keep-alive
   ```

3. **Check event format**:
   - Events should use `event: token` or `event: done`
   - Data should be `data: {"json": "object"}`
   - Must end with double newline `\n\n`

### CORS errors

If you see CORS errors in mobile app logs:

1. **Check backend CORS config** allows:
   - `exp://*` (for Expo Go)
   - `http://localhost:8081` (for dev)
   - Your production scheme

2. **Check preflight requests** (OPTIONS):
   - API responds to OPTIONS requests
   - Includes `Access-Control-Allow-*` headers

## API Response Format

All API responses should follow this format:

### Success Response
```json
{
  "success": true,
  "data": {
    // ... actual response data
  },
  "timestamp": "2025-10-10T12:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "statusCode": 400
  },
  "timestamp": "2025-10-10T12:00:00Z"
}
```

The mobile app API client automatically extracts the `data` field from success responses.

## Next Steps

1. ✅ Configure `.env` with your API URL
2. ✅ Set up Auth0 configuration (mobile + API)
3. ✅ Start your backend API locally
4. ✅ Test API connection from mobile app
5. ✅ Implement API endpoints per OpenAPI spec
6. ✅ Deploy API to staging/production
7. ✅ Configure EAS secrets for production builds

## Resources

- OpenAPI Spec: `docs/api/openapi.yaml`
- Mobile App README: `apps/mobile/README.md`
- API Client Code: `apps/mobile/src/api/`
- Auth0 Docs: https://auth0.com/docs/quickstart/native/react-native
- Expo Docs: https://docs.expo.dev/

## Support

For questions about API integration:
1. Check this guide
2. Review OpenAPI spec
3. Check mobile app API client code
4. Contact the development team

