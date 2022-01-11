import * as Sentry from '@sentry/serverless';
import config from './config';
import fetch from 'node-fetch';
import { getFxaPrivateKey } from './secretManager';
import { generateJwt } from './jwt';
import { SQSEvent } from 'aws-lambda';

// Not DRY -- try lambda layers?
export enum EVENT {
  USER_DELETE = 'user_delete',
  PROFILE_UPDATE = 'profile_update',
}

type FxaEvent = {
  user_id: string;
  event: EVENT;
  timestamp: number;
};

/**
 * Submit deleteUserByFxaId mutation POST request to client-api
 * @param id FxA account ID to delete from Pocket's database
 */
async function submitDeleteMutation(id: string): Promise<any> {
  const privateKey = await getFxaPrivateKey();
  const deleteMutation = `
mutation deleteUser($id: ID!) {
  deleteUserByFxaId(id: $id)
}`;
  const variables = { id: id };
  return await fetch(config.clientApiUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${generateJwt(privateKey, id)}`,
    },
    body: JSON.stringify({ query: deleteMutation, variables }),
  }).then((response) => response.json());
}

/**
 * Lambda handler function. Separated from the Sentry wrapper
 * to make unit-testing easier.
 * Takes records from SQS queue with events, and makes
 * the appropriate request against client-api.
 */
export async function handlerFn(event: SQSEvent) {
  await Promise.all(
    event.Records.map(async (record) => {
      const fxaEvent = JSON.parse(record.body) as FxaEvent;
      if (!fxaEvent.event || !fxaEvent.user_id) {
        throw new Error(
          `Malformed event - missing either 'event' or 'user_id': \n${JSON.stringify(
            fxaEvent
          )}`
        );
      }
      if (fxaEvent.event === EVENT.USER_DELETE) {
        const res = await submitDeleteMutation(fxaEvent.user_id);
        if (res?.errors) {
          throw new Error(
            `Error processing ${record.body}: \n${JSON.stringify(res?.errors)}`
          );
        }
      }
    })
  );
  return {};
}

Sentry.AWSLambda.init({
  dsn: config.app.sentry.dsn,
  release: config.app.sentry.release,
  environment: config.app.environment,
  serverName: config.app.name,
});

export const handler = Sentry.AWSLambda.wrapHandler(handlerFn);
