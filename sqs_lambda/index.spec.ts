import * as fx from './index';
import config from './config';
import nock from 'nock';
import * as jwt from './jwt';
import * as secretManager from './secretManager';

describe('SQS Event Handler', () => {
  beforeAll(() => {
    jest.spyOn(secretManager, 'getFxaPrivateKey').mockResolvedValue('fake_key');
    jest.spyOn(jwt, 'generateJwt').mockReturnValue('fake_token');
  });

  afterAll(() => {
    nock.restore();
    jest.clearAllMocks();
  });

  it('sends a user delete event to client-api', async () => {
    const scope = nock(config.clientApiUri)
      .post('/')
      .reply(200, { data: { deleteUserByFxaId: '12345' } });
    const payload = {
      Records: [
        {
          body: JSON.stringify({
            user_id: '12345',
            event: fx.EVENT.USER_DELETE,
            timestamp: 12345,
          }),
        },
      ],
    };
    // Casting to any just to not require the unecessary SQS event fields
    await fx.handlerFn(payload as any);
    // Nock marks as done if a request was successfully intercepted
    expect(scope.isDone()).toBeTruthy();
  });

  it('sends a profile update - user email updated event to client-api', async () => {
    const scope = nock(config.clientApiUri)
      .post('/')
      .reply(200, {
        data: { updateUserEmailByFxaId: 'newEmail@example.com' },
      });
    const payload = {
      Records: [
        {
          body: JSON.stringify({
            user_id: '12345',
            event: fx.EVENT.PROFILE_UPDATE,
            timestamp: 12345,
            user_email: 'newEmail@example.com',
          }),
        },
      ],
    };
    // Casting to any just to not require the unecessary SQS event fields
    await fx.handlerFn(payload as any);
    // Nock marks as done if a request was successfully intercepted
    expect(scope.isDone()).toBeTruthy();
  });

  it('throws an error if error data is returned from client-api for profile update event', async () => {
    // this error is thrown in the submitEmailUpdatedMutation function on the failed client-api fetch request
    const clientApiRequestError = `Error occurred while requesting client-api: \n${JSON.stringify(
      'SomeClientApiError'
    )}`;

    const replyData = { data: null, errors: { clientApiRequestError } };
    const scope = nock(config.clientApiUri).post('/').reply(200, replyData);
    const record = {
      user_id: '12345',
      event: fx.EVENT.PROFILE_UPDATE,
      timestamp: 12345,
      user_email: 'example@test.com',
    };
    await expect(async () => {
      await fx.handlerFn({
        Records: [{ body: JSON.stringify(record) }],
      } as any);
    }).rejects.toThrow(
      `Error processing ${JSON.stringify(record)}: \n${JSON.stringify(
        replyData.errors
      )}`
    );
    // Nock marks as done if a request was successfully intercepted
    expect(scope.isDone()).toBeTruthy();
  });

  it('throws an error if error data is returned from client-api', async () => {
    const replyData = { data: null, errors: { CODE: 'FORBIDDEN' } };
    const scope = nock(config.clientApiUri).post('/').reply(200, replyData);
    const record = {
      user_id: '12345',
      event: fx.EVENT.USER_DELETE,
      timestamp: 12345,
    };
    await expect(async () => {
      await fx.handlerFn({
        Records: [{ body: JSON.stringify(record) }],
      } as any);
    }).rejects.toThrow(
      `Error processing ${JSON.stringify(record)}: \n${JSON.stringify(
        replyData.errors
      )}`
    );
    // Nock marks as done if a request was successfully intercepted
    expect(scope.isDone()).toBeTruthy();
  });
  it('throws an error if event is missing', async () => {
    const record = {
      user_id: '12345',
      timestamp: 12345,
    };
    await expect(async () => {
      await fx.handlerFn({
        Records: [{ body: JSON.stringify(record) }],
      } as any);
    }).rejects.toThrow('Malformed event');
  });
  it('throws an error if user_id is missing', async () => {
    const record = {
      event: '12345',
      timestamp: 12345,
    };
    await expect(async () => {
      await fx.handlerFn({
        Records: [{ body: JSON.stringify(record) }],
      } as any);
    }).rejects.toThrow('Malformed event');
  });
});
