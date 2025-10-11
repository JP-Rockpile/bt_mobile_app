const AuthSession = require('expo-auth-session');
const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'betthink',
});
console.log('Redirect URI:', redirectUri);
