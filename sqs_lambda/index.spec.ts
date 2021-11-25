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
    await fx.handlerFn({
      Records: [
        { user_id: '12345', event: fx.EVENT.USER_DELETE, timestamp: 12345 },
      ],
    });
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
        Records: [record],
      });
    }).rejects.toThrow(
      `Error processing ${JSON.stringify(record)}: \n${JSON.stringify(
        replyData.errors
      )}`
    );
    // Nock marks as done if a request was successfully intercepted
    expect(scope.isDone()).toBeTruthy();
  });
});
