import * as Sentry from '@sentry/serverless';
import config from './config';

Sentry.AWSLambda.init({
  dsn: config.sentry.dsn,
  release: config.sentry.release,
  environment: config.environment,
});

export const handler = Sentry.AWSLambda.wrapHandler(async (event: any) => {
  console.log('I will handle it');
});
