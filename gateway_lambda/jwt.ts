import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import fetch from 'node-fetch';

/**
 * Get public JWKs from the auth server
 */
async function getPublicJwks(token: any): Promise<any[]> {
  const configUrl = `${token.iss}/.well-known/openid-configuration`;
  const config = (await (await fetch(configUrl)).json()) as any;
  const jwks = (await (await fetch(config.jwks_uri)).json()) as any;
  return jwks.keys;
}

/**
 * Validate the authorization header token
 * Reference: https://mozilla.github.io/ecosystem-platform/docs/process/integration-with-fxa#webhook-events
 * @param headerToken
 */
export async function validate(headerToken: string): Promise<object> {
  // Decode the token, require it to come out ok as an object
  const token = jwt.decode(headerToken, { complete: true });
  if (!token || typeof token === 'string') {
    throw Error('Invalid token type');
  }

  // Get the public jwks from FxA
  let publicJwks: any[] = [];
  try {
    publicJwks = await getPublicJwks(token);
  } catch (error) {
    throw Error(`Unable to fetch public jwks from ${token.iss}`);
  }

  // Verify we have a key for this kid, this assumes that you have fetched
  // the publicJwks from FxA and put both them in an Array.
  const jwk = publicJwks.find((j) => j.kid === token.header.kid);
  if (!jwk) {
    throw Error('No jwk found for this kid: ' + token.header.kid);
  }
  const jwkPem = jwkToPem(jwk);

  // Verify the token is valid
  const decoded = jwt.verify(headerToken, jwkPem, {
    algorithms: ['RS256'],
  });

  // Verify that the required properties exist in the payload
  if (!decoded.payload.sub || !Object.keys(decoded.payload.events).length) {
    throw Error('Invalid token format: ' + decoded);
  }

  // return the decoded JWT
  return decoded;
}
