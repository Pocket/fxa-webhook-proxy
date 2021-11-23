const environment = process.env.ENVIRONMENT || 'development';
const isDev = environment === 'development';

const config = {
  environment: environment,
  sentry: {
    // these values are inserted into the environment in
    // .aws/src/sqsLambda.ts
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
  },
  clientApiUri: isDev
    ? process.env.CLIENT_API_URI || 'https://client-api.getpocket.dev'
    : process.env.CLIENT_API_URI || 'https://client-api.readitlater.com',
};

export default config;
