import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export const cognito = new CognitoIdentityProviderClient({
  region: requireEnv('COGNITO_REGION'),
});

export interface CognitoTokenPayload extends jwt.JwtPayload {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  'cognito:groups'?: string[];
}

export function calculateSecretHash(username: string): string {
  const clientId = requireEnv('COGNITO_CLIENT_ID');
  const clientSecret = requireEnv('COGNITO_CLIENT_SECRET');
  return createHmac('sha256', clientSecret)
    .update(`${username}${clientId}`)
    .digest('base64');
}

let jwksClient: ReturnType<typeof jwksRsa> | null = null;

function getJwksClient() {
  if (!jwksClient) {
    const region = requireEnv('COGNITO_REGION');
    const userPoolId = requireEnv('COGNITO_USER_POOL_ID');
    const jwksUri = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    jwksClient = jwksRsa({
      jwksUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }
  return jwksClient;
}

export async function verifyCognitoToken(token: string): Promise<CognitoTokenPayload> {
  const region = requireEnv('COGNITO_REGION');
  const userPoolId = requireEnv('COGNITO_USER_POOL_ID');
  const clientId = requireEnv('COGNITO_CLIENT_ID');
  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  const client = getJwksClient();

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      (header, callback) => {
        client.getSigningKey(header.kid as string, (err, key) => {
          if (err) {
            callback(err);
            return;
          }
          const signingKey = key?.getPublicKey();
          callback(null, signingKey);
        });
      },
      { issuer, audience: clientId },
      (err, decoded) => {
        if (err) {
          reject(err);
          return;
        }
        if (!decoded || typeof decoded !== 'object') {
          reject(new Error('Invalid Cognito token payload'));
          return;
        }
        resolve(decoded as CognitoTokenPayload);
      }
    );
  });
}
