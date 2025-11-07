import { Router } from 'express';

import { createAlert, listAlerts } from '../db/account-repository.js';
import { recordEvidenceEvent } from '../services/audit-log.js';
import { writeEvidence } from '../services/evidence.js';
import { getSmeScope, hasSmeScope } from '../utils/sme-scope.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const accountId = typeof req.query.account_id === 'string' ? req.query.account_id : undefined;
    const scope = getSmeScope(req);
    if (!hasSmeScope(scope)) {
      res.status(403);
      throw new Error('Unable to determine SME context for alerts request');
    }

    const data = await listAlerts({ accountId, scope });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { account_id: accountId, type, status, payload } = req.body;
    if (!accountId || !type || !status) {
      res.status(400);
      throw new Error('account_id, type and status are required');
    }

    const safePayload = typeof payload === 'object' && payload !== null ? payload : {};

    const alert = await createAlert({
      accountId,
      type,
      status,
      payload: safePayload,
    });

    const keyPrefix = `env=${process.env.APP_ENV ?? 'dev'}/date=${new Date()
      .toISOString()
      .slice(0, 10)}/corr=${req.context.correlationId}`;

    const evidence = {
      correlation_id: req.context.correlationId,
      actor: req.context.actor,
      action: 'alert.create',
      request: {
        path: req.path,
        body: req.body,
      },
      response: {
        status: 201,
        body: alert,
      },
      explain: `Alert created for ${accountId}`,
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

    res.status(201).json({ data: alert });
  } catch (err) {
    next(err);
  }
});

export default router;
