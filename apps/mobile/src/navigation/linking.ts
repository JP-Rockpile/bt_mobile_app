import * as Linking from 'expo-linking';

export const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    initialRouteName: '(app)',
    screens: {
      '(app)': {
        screens: {
          'index': 'home',
          'chat/[threadId]': 'chat/:threadId',
          'auth/callback': 'auth/callback',
        },
      },
    },
  },
};

