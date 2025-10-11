# Repository Reorganization Summary

This document summarizes the changes made to reorganize the repository for working with a separate backend API.

## Changes Made

### ✅ Created Files

1. **`apps/mobile/.env.example`**
   - Comprehensive environment configuration template
   - Includes API URL, Auth0, analytics, and feature flags
   - Clear documentation for each variable

2. **`docs/API_INTEGRATION.md`**
   - Complete guide for connecting mobile app to backend API
   - Architecture diagrams and flow explanations
   - Troubleshooting section
   - Local development setup instructions
   - Deployment configuration

3. **`docs/api/openapi.yaml`**
   - Moved from `services/api/openapi.yaml`
   - Complete API specification for backend implementation

### 🗑️ Removed

1. **`services/` directory**
   - Removed placeholder API and model services
   - These are now in your separate API repository

### 📝 Updated Documentation

1. **Root `README.md`**
   - Updated to reflect mobile-first repository structure
   - Removed references to services in this repo
   - Added prominent links to API Integration Guide
   - Clarified that backend API is separate

2. **`apps/mobile/README.md`**
   - Added backend API setup instructions
   - Updated architecture section
   - Emphasized API integration requirements

## Repository Structure (After Changes)

```
bt_mobile_app/
├── apps/
│   └── mobile/              # React Native mobile app
│       ├── .env.example     # ✨ NEW: Environment configuration
│       └── src/
│           └── api/         # Pre-built API client
├── packages/
│   └── shared/              # Shared types and schemas
├── docs/                    # ✨ NEW directory
│   ├── api/
│   │   └── openapi.yaml     # ✨ MOVED: API specification
│   └── API_INTEGRATION.md   # ✨ NEW: Integration guide
└── README.md                # ✅ UPDATED
```

## Quick Start Guide

### 1. Configure Environment

```bash
cd apps/mobile
cp .env.example .env
```

Edit `.env` with your settings:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000  # Your API URL
EXPO_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=your-client-id
```

### 2. Start Backend API (Separate Repo)

In your backend API repository:
```bash
npm install
npm run dev  # Should start on port 3000
```

### 3. Start Mobile App

```bash
cd apps/mobile
npm install
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator

## Next Steps

### For Mobile App Development

1. ✅ Configure `.env` file
2. ✅ Ensure Auth0 is set up
3. ✅ Test connection to backend API
4. ✅ Start building features

### For Backend API Development

1. 📋 Implement endpoints from `docs/api/openapi.yaml`
2. 🔐 Set up Auth0 token validation
3. 🗄️ Configure database (PostgreSQL recommended)
4. 📡 Implement SSE streaming for LLM responses
5. 🔔 Set up push notification dispatch

## Key Integration Points

### Authentication
- **Mobile**: Uses Auth0 PKCE flow, stores tokens securely
- **Backend**: Must validate Auth0 JWT tokens with same audience
- **Shared**: Same Auth0 tenant, domain, and audience

### API Client
- **Location**: `apps/mobile/src/api/`
- **Features**: Auto token refresh, error handling, request logging
- **Usage**: Import from `@/api/endpoints`

### Data Flow
1. User interacts with mobile app
2. Mobile app makes authenticated request to backend API
3. Backend validates token, processes request
4. Backend returns response (or streams via SSE)
5. Mobile app updates UI and local SQLite cache

## Important Notes

### CORS Configuration
Your backend API must allow CORS from:
- `http://localhost:8081` (Expo dev server)
- `exp://*` (Expo Go app)
- `betthink://*` (Production mobile app)

### Network Configuration

**Local Development**:
- iOS Simulator: `http://localhost:3000` ✅
- Android Emulator: `http://10.0.2.2:3000` or `http://localhost:3000`
- Physical Device: `http://YOUR_COMPUTER_IP:3000` (e.g., `http://192.168.1.100:3000`)

**Production**:
- Use HTTPS URLs
- Configure via EAS secrets

### Shared Types

The `packages/shared/` directory contains TypeScript types and Zod schemas that can be used in both:
- This mobile app repository
- Your backend API repository (can be imported if needed)

## Documentation Reference

- 📖 **[API Integration Guide](./docs/API_INTEGRATION.md)** - Start here!
- 📋 **[OpenAPI Specification](./docs/api/openapi.yaml)** - API contract
- 📱 **[Mobile App README](./apps/mobile/README.md)** - Mobile app docs
- 🏗️ **[Architecture Guide](./apps/mobile/ARCHITECTURE.md)** - Technical details

## Troubleshooting

### Mobile app can't connect to API
1. Check API is running: `curl http://localhost:3000/api/health`
2. Verify `.env` has correct `EXPO_PUBLIC_API_URL`
3. On Android emulator, try `http://10.0.2.2:3000`
4. On physical device, use your computer's local IP

### Authentication errors
1. Verify Auth0 config matches in mobile app and backend
2. Check callback URLs in Auth0 dashboard
3. Ensure backend validates tokens correctly

### Need more help?
See the [API Integration Guide](./docs/API_INTEGRATION.md) for detailed troubleshooting.

---

**Repository reorganization completed!** 🎉

The mobile app is ready to connect to your separate backend API. Follow the [API Integration Guide](./docs/API_INTEGRATION.md) for detailed setup instructions.

