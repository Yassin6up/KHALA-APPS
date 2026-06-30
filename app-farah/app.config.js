// Dynamic config: reads EXPO_PUBLIC_API_URL from .env for local device testing.
// Create app-farah/.env with: EXPO_PUBLIC_API_URL=http://192.168.x.x:4000/v1
const base = require('./app.json');

module.exports = {
  ...base.expo,
  extra: {
    ...base.expo.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/v1',
    appKey: 'farah',
  },
};
