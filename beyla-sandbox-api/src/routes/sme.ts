import { Router } from 'express';

import { pool } from '../db/pool.js';
import { getLatestSmeProfile, recordSmeProfile } from '../db/user-repository.js';
import { simulateSmeData } from '../services/sme-simulator.js';

const router = Router();

router.post('/simulations', async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Authentication required');
    }

    const companyRegNumber = req.user.companyRegNumber?.trim();
    const entityName = req.user.entityName?.trim();

    if (!companyRegNumber || !entityName) {
      res.status(400);
      throw new Error('Company profile is incomplete. Please update registration details.');
    }

    const result = await simulateSmeData(req.user);

    await recordSmeProfile(req.user.id, result.dataset);

    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/profile', async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Authentication required');
    }

    const profile = await getLatestSmeProfile(req.user.id);
    if (!profile) {
      res.json({ data: null });
      return;
    }

    res.json({
      data: {
        dataset: profile.dataset,
        createdAt: profile.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/data', async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Authentication required');
    }

    const companyRegNumber = req.user.companyRegNumber?.trim();
    if (!companyRegNumber) {
      res.status(400);
      throw new Error('Company registration number missing');
    }

    await pool.query('DELETE FROM accounts WHERE raw ->> \'company_reg_number\' = $1', [companyRegNumber]);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
