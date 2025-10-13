# Auth0 Setup for Expo Auth Session

## Overview
We've migrated from `react-native-auth0` to `expo-auth-session` to avoid native module issues and work seamlessly with Expo Go.

## Auth0 Configuration Required

### 1. Callback URLs
Add these to your Auth0 Application Settings > Allowed Callback URLs:

**Development (Expo Go):**
```
exp://10.0.0.40:8082
exp://127.0.0.1:8082
exp://localhost:8082
```

**Production (Standalone Build):**
```
betthink://auth/callback
```

⚠️ **Important**: The IP address and port may vary based on your network and Expo dev server. Check your terminal logs for the exact URL (look for "🔐 Auth redirect URI:") when you click "Sign In".

### 2. Logout URLs
Add these to your Auth0 Application Settings > Allowed Logout URLs:

**Development:**
```
betthink://
exp://127.0.0.1:8081/--/
```

**Production:**
```
betthink://
```

### 3. Allowed Web Origins
Add these to your Auth0 Application Settings > Allowed Web Origins:

```
https://{yourDomain}
```

### 4. Application Type
Ensure your Auth0 application is set to:
- **Application Type**: Native
- **Token Endpoint Authentication Method**: None (for PKCE)

### 5. Refresh Token Settings
Under Advanced Settings > Grant Types, ensure these are checked:
- ✅ Authorization Code
- ✅ Refresh Token

### 6. CORS Settings
Under Application Settings > Allowed Origins (CORS):
```
exp://127.0.0.1:8081
```

## Testing

### In Expo Go:
```bash
cd apps/mobile
npm start
# or
yarn start
```

### Test the flow:
1. Click "Sign In"
2. You should be redirected to Auth0 login page in a web browser
3. After login, you'll be redirected back to the app
4. Test logout
5. Test logging back in

## Environment Variables
Make sure these are set in your `.env` file:
```
EXPO_PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=your-client-id
EXPO_PUBLIC_AUTH0_AUDIENCE=your-api-audience
```

## Key Changes Made

1. ✅ Replaced `react-native-auth0` with `expo-auth-session` and `expo-crypto`
2. ✅ Updated `auth.service.ts` to use Expo's auth APIs
3. ✅ Removed `react-native-auth0` plugin from `app.config.ts`
4. ✅ Exported `User` and `AuthTokens` types from auth service
5. ✅ Updated auth store to import types from auth service

## Benefits

- ✅ Works with Expo Go (no custom dev build needed)
- ✅ No native module issues
- ✅ No need for Xcode or Android Studio during development
- ✅ Faster development iteration
- ✅ Uses PKCE for secure authentication

