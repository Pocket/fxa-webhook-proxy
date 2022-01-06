import jwt from 'jsonwebtoken';
import fs from 'fs';
import { FxaJwt } from './jwt';
import sinon from 'sinon';

describe('jwt', () => {
  const publicKey = fs.readFileSync(__dirname + '/test/jwtRS256.key.pub', {
    encoding: 'ascii',
  }) as string;
  const privateKey = fs.readFileSync(__dirname + '/test/jwtRS256.key', {
    encoding: 'ascii',
  }) as string;
  const otherPrivateKey = fs.readFileSync(
    __dirname + '/test/private-other.key',
    {
      encoding: 'ascii',
    }
  ) as string;
  describe('validate', () => {
    let getPublicJwkStub;
    beforeAll(() => {
      getPublicJwkStub = sinon.stub(FxaJwt.prototype, 'getPublicJwk');
      getPublicJwkStub.resolves(publicKey);
    });
    afterAll(() => {
      getPublicJwkStub.restore();
    });
    it('should throw an error if jwt could not be decoded', async () => {
      await expect(async () => {
        await new FxaJwt('abc123imnotarealjwt').validate();
      }).rejects.toThrow('Token could not be decoded.');
    });
    it('should throw an error if jwt was not signed by expected key', async () => {
      const token = jwt.sign({ hello: 'world' }, otherPrivateKey, {
        algorithm: 'RS256',
      });
      await expect(async () => {
        await new FxaJwt(token).validate();
      }).rejects.toThrow();
    });
    it('should throw an error if payload did not contain `sub`', async () => {
      const token = jwt.sign({ events: { crew: 'olympics' } }, privateKey, {
        algorithm: 'RS256',
      });
      await expect(async () => {
        await new FxaJwt(token).validate();
      }).rejects.toThrow('Invalid token format: ');
    });
    it('should throw an error if payload did not contain `events`', async () => {
      const token = jwt.sign({ sub: 'plamen' }, privateKey, {
        algorithm: 'RS256',
      });
      await expect(async () => {
        await new FxaJwt(token).validate();
      }).rejects.toThrow('Invalid token format: ');
    });
    it('should throw an error if payload events are empty', async () => {
      const token = jwt.sign({ sub: 'plamen', events: {} }, privateKey, {
        algorithm: 'RS256',
      });
      await expect(async () => {
        await new FxaJwt(token).validate();
      }).rejects.toThrow('Invalid token format: ');
    });
    it('should return a payload', async () => {
      const payload = { sub: 'plamen', events: { crew: 'olympics' } };

      const token = jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
      });
      const result = await new FxaJwt(token).validate();
      expect(result).toEqual(expect.objectContaining(payload));
    });
  });
});
