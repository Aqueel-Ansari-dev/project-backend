import { Router } from 'express';

import { listBalances } from '../db/account-repository.js';
import { getSmeScope, hasSmeScope } from '../utils/sme-scope.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const scope = getSmeScope(req);
    if (!hasSmeScope(scope)) {
      res.status(403);
      throw new Error('Unable to determine SME context for balances request');
    }

    const balances = await listBalances(scope);
    res.json({ data: balances });
  } catch (err) {
    next(err);
  }
});

export default router;
