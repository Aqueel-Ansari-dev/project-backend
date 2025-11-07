import { NextFunction, Request, Response } from 'express';

import { verifyToken, type TokenPayload } from '../utils/jwt.js';

export interface AuthenticatedUser {
  id: string;
  type: string;
  email?: string;
  roles?: string[];
  companyRegNumber?: string;
  entityName?: string;
  accountExternalId?: string;
  sector?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

const publicPathPatterns = [/^\/health\//, /^\/auth\//];

function isPublicPath(path: string): boolean {
  return publicPathPatterns.some((pattern) => pattern.test(path));
}

function mapTokenToUser(payload: TokenPayload): AuthenticatedUser {
  const id = payload.sub;
  if (!id) {
    throw new Error('Invalid token payload');
  }

  return {
    id,
    type: payload.type ?? 'user',
    email: payload.email,
    roles: Array.isArray(payload.roles) ? payload.roles : undefined,
    companyRegNumber: payload.companyRegNumber,
    entityName: payload.companyName ?? payload.entityName,
    accountExternalId: payload.accountExternalId ?? payload.sub,
    sector: payload.sector,
  };
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  if (isPublicPath(req.path)) {
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    res.status(401);
    next(new Error('Authentication token is required'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401);
    next(new Error('Authentication token is required'));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = mapTokenToUser(payload);
    next();
  } catch (err) {
    res.status(401);
    next(err instanceof Error ? err : new Error('Invalid or expired token'));
  }
}
