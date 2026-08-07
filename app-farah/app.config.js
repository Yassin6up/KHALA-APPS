// Dynamic config: reads EXPO_PUBLIC_API_URL from .env for local device testing.
// Create app-farah/.env with: EXPO_PUBLIC_API_URL=http://192.168.x.x:4000/v1
const base = require('./app.json');

module.exports = {
  ...base.expo,
  extra: {
    ...base.expo.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.khalaapps.com/v1',
    appKey: 'farah',
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
    eas: {
      projectId: '26903dce-0bf8-4e12-ae11-6234e3115e3c',
    },
  },
};
