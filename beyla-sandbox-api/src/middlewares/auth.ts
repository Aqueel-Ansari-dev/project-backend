import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  type: string;
  email?: string;
  roles?: string[];
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

const publicPaths = new Set(['/health/live', '/health/ready']);

function authorizeWithAdminKey(req: Request): AuthenticatedUser | undefined {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return undefined;
  }

  const headerKey = req.header('x-admin-key');
  if (headerKey && headerKey === adminKey) {
    return { id: 'admin-api-key', type: 'api-key' };
  }

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token === adminKey) {
      return { id: 'admin-api-key', type: 'api-key' };
    }
  }

  return undefined;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (publicPaths.has(req.path)) {
    return next();
  }

  const adminUser = authorizeWithAdminKey(req);
  if (adminUser) {
    req.user = adminUser;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Invalid Authorization header' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret not configured. Set JWT_SECRET or use ADMIN_API_KEY.');
    }

    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    req.user = {
      id: decoded.sub ?? decoded.id ?? 'unknown',
      email: typeof decoded.email === 'string' ? decoded.email : undefined,
      roles: Array.isArray(decoded.roles) ? (decoded.roles as string[]) : undefined,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', detail: (err as Error).message });
  }
}
