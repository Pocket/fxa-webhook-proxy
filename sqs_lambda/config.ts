const config = {
  environment: process.env.ENVIRONMENT || 'development',
  sentry: {
    // these values are inserted into the environment in
    // .aws/src/sqsLambda.ts
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
  },
};

export default config;
