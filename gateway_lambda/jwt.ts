import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import fetch from 'node-fetch';
import { FxaPayload } from './types';

export class FxaJwt {
  public readonly token: jwt.Jwt;

  constructor(public readonly headerToken: string) {
    // Decode the token, require it to come out ok as an object
    const decoded: jwt.Jwt | null = jwt.decode(headerToken, {
      complete: true,
    });
    if (!decoded) {
      throw Error(`Token could not be decoded.`);
    }
    this.token = decoded;
  }
  /**
   * Get public JWK from the auth server
   */
  public async getPublicJwk() {
    if (!this.token.payload.iss) {
      throw new Error('Invalid token: No token issuer.');
    }
    if (!this.token.header.kid) {
      throw new Error('Invalid token: No token kid.');
    }
    const configUrl = `${this.token.payload.iss}/.well-known/openid-configuration`;
    const config = (await (await fetch(configUrl)).json()) as any;
    const client = jwksClient({ jwksUri: config.jwks_uri });
    const key = await client.getSigningKey(this.token.header.kid);
    return key.getPublicKey();
  }

  /**
   * Validate the authorization header token
   * Reference: https://mozilla.github.io/ecosystem-platform/docs/process/integration-with-fxa#webhook-events
   */
  public async validate() {
    const key = await this.getPublicJwk();

    const payload = jwt.verify(this.headerToken, key, {
      algorithms: ['RS256'],
    }) as jwt.JwtPayload; // this payload is an object, not a string

    // Verify that the required properties exist in the payload
    if (
      !payload.sub ||
      !payload.events ||
      !Object.keys(payload.events).length
    ) {
      throw Error('Invalid token format: ' + JSON.stringify(payload));
    }
    // return the decoded JWT payload
    return payload as FxaPayload;
  }
}
