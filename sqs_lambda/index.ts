import * as Sentry from '@sentry/serverless';
import config from './config';
import fetch from 'node-fetch';

// Not DRY -- try lambda layers?
export enum EVENT {
  USER_DELETE = 'user_delete',
  PROFILE_UPDATE = 'profile_update',
}

type SqsEvent = {
  user_id: string;
  event: EVENT;
  timestamp: number;
};

/**
 * Submit deleteUserByFxaId mutation POST request to client-api
 * @param id FxA account ID to delete from Pocket's database
 */
async function submitDeleteMutation(id: string): Promise<any> {
  const deleteMutation = `
mutation deleteUser($id: ID!) {
  deleteUserByFxaId(id: $id)
}`;
  const variables = { id: id };
  return await fetch(config.clientApiUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // TODO: INFRA-169
      // Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: deleteMutation, variables }),
  }).then((response) => response.json());
}

/**
 * Lambda handler function. Separated from the Sentry wrapper
 * to make unit-testing easier.
 * Takes records from SQS queue with events, and makes
 * the appropriate request against client-api.
 * TODO: Authorization bearer - INFRA-169
 */
export async function handlerFn(event: { Records: SqsEvent[] }) {
  await Promise.all(
    event.Records.map(async (record: SqsEvent) => {
      if (record.event === EVENT.USER_DELETE) {
        const res = await submitDeleteMutation(record.user_id);
        if (res?.errors) {
          throw new Error(
            `Error processing ${JSON.stringify(record)}: \n${JSON.stringify(
              res?.errors
            )}`
          );
        }
      }
    })
  );
  return {};
}

Sentry.AWSLambda.init({
  dsn: config.sentry.dsn,
  release: config.sentry.release,
  environment: config.environment,
  serverName: config.name,
});
export const handler = Sentry.AWSLambda.wrapHandler(handlerFn);
