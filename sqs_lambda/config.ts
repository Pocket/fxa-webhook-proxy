const environment = process.env.ENVIRONMENT || 'development';
const isDev = environment === 'development';

const config = {
  name: 'Sqs-FxA-Events-Lambda',
  environment: environment,
  sentry: {
    // these values are inserted into the environment in
    // .aws/src/sqsLambda.ts
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
  },
  aws: {
    region: process.env.region || 'us-east-1',
    keyName: process.env.key || 'FxAWebhookProxy/dev/privateKey',
  },
  clientApiUri: isDev
    ? process.env.CLIENT_API_URI || 'https://client-api.getpocket.dev'
    : process.env.CLIENT_API_URI || 'https://client-api.readitlater.com',
};

export default config;
