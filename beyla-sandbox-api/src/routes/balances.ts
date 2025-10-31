import { Router } from 'express';

import { listBalances } from '../db/account-repository.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const balances = await listBalances();
    res.json({ data: balances });
  } catch (err) {
    next(err);
  }
});

export default router;
