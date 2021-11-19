import { expect } from 'chai';
import sinon from 'sinon';
import {
  createSuccessResponseMessage,
  formatResponse,
  generateEvents,
} from './index';
import { EVENT, SqsEvent } from './types';

describe('Handler functions', () => {
  describe('Format of API Gateway response', () => {
    it('should format a successful response in a standard way', () => {
      const statusCode = 200;
      const actual = formatResponse(statusCode, 'Hello');
      expect(actual).to.deep.equal({
        statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statusCode, message: 'Hello' }),
      });
    });

    it('should format an response in a standard way', () => {
      const statusCode = 400;
      const actual = formatResponse(statusCode, 'Bad request', true);
      expect(actual).to.deep.equal({
        statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statusCode, error: 'Bad request' }),
      });
    });
  });

  describe('Generating SQS events data', () => {
    let clock;
    const now = Date.now();

    beforeAll(() => {
      clock = sinon.useFakeTimers({
        now: now,
        shouldAdvanceTime: true,
      });
    });

    afterAll(() => clock.restore());

    it('should generate SQS event data for FxA profile change event', () => {
      const data = {
        payload: {
          sub: 'FXA_USER_ID',
          events: {
            'https://schemas.accounts.firefox.com/event/profile-change': {},
          },
        },
      };

      const actual: SqsEvent[] = generateEvents(data);
      expect(actual[0]).to.deep.equal({
        user_id: 'FXA_USER_ID',
        event: EVENT.PROFILE_UPDATE,
        timestamp: Math.round(now / 1000),
      });
    });

    it('should generate SQS event data for FxA user delete event', () => {
      const data = {
        payload: {
          sub: 'FXA_USER_ID',
          events: {
            'https://schemas.accounts.firefox.com/event/delete-user': {},
          },
        },
      };

      const actual: SqsEvent[] = generateEvents(data);
      expect(actual[0]).to.deep.equal({
        user_id: 'FXA_USER_ID',
        event: EVENT.USER_DELETE,
        timestamp: Math.round(now / 1000),
      });
    });

    it('should generate SQS event data for multiple FxA events', () => {
      const data = {
        payload: {
          sub: 'FXA_USER_ID',
          events: {
            'https://schemas.accounts.firefox.com/event/delete-user': {},
            'https://schemas.accounts.firefox.com/event/profile-change': {},
          },
        },
      };

      const actual: SqsEvent[] = generateEvents(data);
      const timestamp = Math.round(now / 1000);
      expect(actual).to.deep.equal([
        {
          user_id: 'FXA_USER_ID',
          event: EVENT.USER_DELETE,
          timestamp,
        },
        {
          user_id: 'FXA_USER_ID',
          event: EVENT.PROFILE_UPDATE,
          timestamp,
        },
      ]);
    });
  });

  describe('Successful response message', () => {
    it('should create a successful response message', () => {
      const actual = createSuccessResponseMessage(1, 0);
      expect(actual).to.equal(`Successfully sent 1 out of 1 events to SQS.`);
    });

    it('should create a successful response message with failed event info ', () => {
      const actual = createSuccessResponseMessage(2, 1);
      expect(actual).to.equal(
        `Successfully sent 1 out of 2 events to SQS. Review cloudwatch and sentry logs for information about failed events.`
      );
    });
  });
});
