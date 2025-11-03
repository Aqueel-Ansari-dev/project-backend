import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { authMiddleware } from './middlewares/auth.js';
import { correlationMiddleware } from './middlewares/correlation.js';
import { errorHandler } from './middlewares/error-handler.js';
import { requestContextMiddleware } from './middlewares/request-context.js';
import alertsRouter from './routes/alerts.js';
import balancesRouter from './routes/balances.js';
import healthRouter from './routes/health.js';
import datasetsRouter from './routes/datasets.js';
import transactionsRouter from './routes/transactions.js';

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

app.use(express.json());
app.use(cors({ origin: true }));
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX ?? '120'),
}));
app.use(correlationMiddleware);
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    },
    serializers: {
      req(req) {
        return {
          id: (req as any).correlationId,
          method: req.method,
          url: req.url,
        };
      },
    },
  })
);
app.use('/health', healthRouter);
app.use('/balances', authMiddleware, requestContextMiddleware, balancesRouter);
app.use('/transactions', authMiddleware, requestContextMiddleware, transactionsRouter);
app.use('/alerts', authMiddleware, requestContextMiddleware, alertsRouter);
app.use('/datasets', authMiddleware, requestContextMiddleware, datasetsRouter);

app.use(errorHandler);

const port = Number(process.env.PORT ?? '8080');
app.listen(port, () => {
  logger.info({ msg: `API listening on :${port}`, env: process.env.APP_ENV ?? 'dev' });
});
