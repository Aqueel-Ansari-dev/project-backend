import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function correlationMiddleware(req: Request, _res: Response, next: NextFunction) {
  const existing = req.header('x-correlation-id') ?? req.header('x-request-id');
  (req as any).correlationId = existing ?? uuidv4();
  next();
}
