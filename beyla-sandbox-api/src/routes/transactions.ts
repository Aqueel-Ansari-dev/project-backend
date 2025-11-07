import { Router } from 'express';

import {
  createTransaction,
  listTransactions,
} from '../db/account-repository.js';
import { recordEvidenceEvent } from '../services/audit-log.js';
import { writeEvidence } from '../services/evidence.js';
import { getSmeScope, hasSmeScope } from '../utils/sme-scope.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const accountId = typeof req.query.account_id === 'string' ? req.query.account_id : undefined;
    const limitParam = req.query.limit ? Number(req.query.limit) : undefined;
    const limit = limitParam && Number.isFinite(limitParam) ? Math.min(Math.max(Math.floor(limitParam), 1), 500) : undefined;
    const scope = getSmeScope(req);
    if (!hasSmeScope(scope)) {
      res.status(403);
      throw new Error('Unable to determine SME context for transactions request');
    }

    const data = await listTransactions({ accountId, limit, scope });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { account_id: accountId, amount, currency, description, category, direction } = req.body;
    if (!accountId || amount === undefined || !currency || !direction) {
      res.status(400);
      throw new Error('account_id, amount, currency and direction are required');
    }

    const normalizedDirection = String(direction).toLowerCase();
    if (!['in', 'out'].includes(normalizedDirection)) {
      res.status(400);
      throw new Error('direction must be "in" or "out"');
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
      res.status(400);
      throw new Error('amount must be a number');
    }

    const normalizedCurrency = String(currency).toUpperCase();
    if (normalizedCurrency.length !== 3) {
      res.status(400);
      throw new Error('currency must be a 3-letter code');
    }

    const transaction = await createTransaction({
      accountId,
      amount: numericAmount,
      currency: normalizedCurrency,
      description,
      category,
      direction: normalizedDirection as 'in' | 'out',
    });

    const keyPrefix = `env=${process.env.APP_ENV ?? 'dev'}/date=${new Date()
      .toISOString()
      .slice(0, 10)}/corr=${req.context.correlationId}`;

    const evidence = {
      correlation_id: req.context.correlationId,
      actor: req.context.actor,
      action: 'transaction.create',
      request: {
        path: req.path,
        body: req.body,
      },
      response: {
        status: 201,
        body: transaction,
      },
      explain: description ?? 'Transaction created',
      ts: new Date().toISOString(),
      service: 'sandbox-api',
      ip: req.context.ip,
    } as const;

    const { key } = await writeEvidence(keyPrefix, evidence);
    await recordEvidenceEvent({
      correlationId: req.context.correlationId,
      s3Key: key,
      actor: evidence.actor,
      action: evidence.action,
    });

    res.status(201).json({ data: transaction });
  } catch (err) {
    next(err);
  }
});

export default router;
