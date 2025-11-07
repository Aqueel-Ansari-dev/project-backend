import jwt from 'jsonwebtoken';

const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 12; // 12 hours

export interface TokenPayload extends jwt.JwtPayload {
  sub: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  companyRegNumber?: string;
  sector?: string;
  type?: string;
  roles?: string[];
  accountExternalId?: string;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-secret-change-me';
  if (!secret) {
    throw new Error('JWT secret is not configured');
  }
  return secret;
}

export function issueToken(payload: TokenPayload, expiresIn: number = DEFAULT_EXPIRY_SECONDS): { token: string; expiresIn: number } {
  const token = jwt.sign(payload, getJwtSecret(), { expiresIn });
  return { token, expiresIn };
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());
  if (!decoded || typeof decoded !== 'object') {
    throw new Error('Invalid token payload');
  }
  return decoded as TokenPayload;
}
