import { NextFunction, Request, Response } from 'express';

export interface RequestContext {
  correlationId: string;
  actor?: {
    id: string;
    type: string;
  };
  ip?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    context: RequestContext;
  }
}

export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  const correlationId = (req as any).correlationId as string;
  req.context = {
    correlationId,
    actor: req.user ? { id: req.user.id, type: req.user.type } : undefined,
    ip: req.ip,
  };
  next();
}
