import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import config from './config';

type JwtPayload = {
  iss: string;
  aud: string;
  iat: number; //timestamp
  exp: number;
  sub: string;
  apiId?: string;
};
/**
 * generates jwt token from the given private key
 * @param payload
 * @param privateKey
 * @param fxaId
 * https://www.npmjs.com/package/jsonwebtoken
 */
export function generateJwt(privateKey, fxaId: string) {
  const payload: JwtPayload = {
    iss: config.jwt.iss,
    aud: config.jwt.aud,
    iat: Date.now() / 1000,
    exp: Math.floor(Date.now() / 1000) + 60 * 10, //expires in 10 mins
    sub: fxaId,
    //todo: add apiId
  };

  return jwt.sign(payload, jwkToPem(privateKey, { private: true }), {
    algorithm: 'RS256',
  });
}