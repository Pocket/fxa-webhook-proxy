import * as Sentry from '@sentry/serverless';
import config from './config';
import fetch from 'node-fetch';
import { getFxaPrivateKey } from './secretManager';
import { generateJwt } from './jwt';
import { SQSEvent } from 'aws-lambda';

export enum EVENT {
  USER_DELETE = 'user_delete',
  PROFILE_UPDATE = 'profile_update',

  APPLE_MIGRATION = 'apple_migration',
}

type FxaEvent = {
  user_id: string;
  event: EVENT;
  timestamp: number;
  user_email?: string;

  transfer_sub?: string;
};

type EmailUpdatedEvent = Omit<FxaEvent, 'event' | 'user_email'> & {
  event: EVENT.PROFILE_UPDATE;
  user_email: string;
};

function isInvalidFxaEvent(fxaEvent: FxaEvent): boolean {
  return !fxaEvent.event || !fxaEvent.user_id;
}

function isEmailUpdatedEvent(
  fxaEvent: FxaEvent
): fxaEvent is EmailUpdatedEvent {
  return !!(fxaEvent.user_email && fxaEvent.event === EVENT.PROFILE_UPDATE);
}

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
 * Submit migrateAppleUser mutation POST request to client-api
 * @param id FxA account ID to delete from Pocket's database
 * @param email User email in the Fx event payload
 * @param transferSub primary ID connecting fxa account and pocket account
 */
async function migrateAppleUserMutation(
  id: string,
  email: string,
  transferSub: string
): Promise<any> {
  const privateKey = await getFxaPrivateKey();
  const migrateAppleUser = `
mutation migrateAppleUser($fxaId: ID!, $email: String!) {
  migrateAppleUser(fxaId: $fxaId, email: $email)
}`;
  const variables = { fxaId: id, email: email };
  return await fetch(config.clientApiUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${generateJwt(privateKey, id)}`,
      transfersub: transferSub,
    },
    body: JSON.stringify({ query: migrateAppleUser, variables }),
  }).then((response) => response.json());
}

/**
 * Submit UpdateUserEmailByFxaId mutation POST request to client-api
 * This function is called when a PROFILE_UPDATE event is received with an email in its payload
 * @param id FxA account ID
 * @param email User email in the Fx event payload
 */
async function submitEmailUpdatedMutation(
  id: string,
  email: string
): Promise<any> {
  const privateKey = await getFxaPrivateKey();

  const updateUserEmailMutation = `mutation UpdateUserEmailByFxaId($id: ID!, $email: String!) {updateUserEmailByFxaId(id: $id, email: $email) {
    email
  }
}`;

  const variables = { id, email };
  return await fetch(config.clientApiUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${generateJwt(privateKey, id)}`,
    },
    body: JSON.stringify({ query: updateUserEmailMutation, variables }),
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

      if (isInvalidFxaEvent(fxaEvent)) {
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

      if (fxaEvent.event === EVENT.APPLE_MIGRATION) {
        if (!fxaEvent.user_email) {
          throw new Error(
            `Error processing ${record.body}: missing user_email`
          );
        }

        if (!fxaEvent.transfer_sub) {
          throw new Error(
            `Error processing ${record.body}: missing transfer_sub`
          );
        }

        const res = await migrateAppleUserMutation(
          fxaEvent.user_id,
          fxaEvent.user_email,
          fxaEvent.transfer_sub
        );
        if (res?.errors) {
          throw new Error(
            `Error processing ${record.body}: \n${JSON.stringify(res?.errors)}`
          );
        }
      }

      if (fxaEvent.event === EVENT.PROFILE_UPDATE) {
        // only handling email updates in this block for this event
        // early exit if no email property present
        if (!isEmailUpdatedEvent(fxaEvent)) {
          return;
        }

        const res = await submitEmailUpdatedMutation(
          fxaEvent.user_id,
          fxaEvent.user_email
        );

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
