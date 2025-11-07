import { NextFunction, Request, Response } from 'express';

export interface AuthenticatedUser {
  id: string;
  type: string;
  email?: string;
  roles?: string[];
  companyRegNumber?: string;
  entityName?: string;
  accountExternalId?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

const publicPaths = new Set(['/health/live', '/health/ready']);

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!publicPaths.has(req.path)) {
    req.user = req.user ?? {
      id: 'sandbox-user',
      type: 'sandbox',
      companyRegNumber: process.env.SANDBOX_COMPANY_REG_NUMBER?.trim() || undefined,
      entityName: process.env.SANDBOX_ENTITY_NAME?.trim() || undefined,
      accountExternalId: process.env.SANDBOX_ACCOUNT_EXTERNAL_ID?.trim() || undefined,
    };
  }
  next();
}
