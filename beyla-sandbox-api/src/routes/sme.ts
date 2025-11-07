import { Router } from 'express';

import { pool } from '../db/pool.js';
import { getLatestSmeProfile, recordSmeProfile } from '../db/user-repository.js';
import { simulateSmeData } from '../services/sme-simulator.js';

const router = Router();

async function loadSimulationSummary(companyRegNumber: string) {
  const [summaryResult, accountResult] = await Promise.all([
    pool.query<{
      accounts: string | number;
      balances: string | number;
      transactions: string | number;
      alerts: string | number;
    }>(
      `SELECT
        (SELECT COUNT(*) FROM accounts WHERE source = 'simulation' AND raw ->> 'company_reg_number' = $1) AS accounts,
        (SELECT COUNT(*) FROM balances b JOIN accounts a ON a.id = b.account_id WHERE a.source = 'simulation' AND a.raw ->> 'company_reg_number' = $1) AS balances,
        (SELECT COUNT(*) FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE a.source = 'simulation' AND a.raw ->> 'company_reg_number' = $1) AS transactions,
        (SELECT COUNT(*) FROM alerts al JOIN accounts a ON a.id = al.account_id WHERE a.source = 'simulation' AND a.raw ->> 'company_reg_number' = $1) AS alerts
      `,
      [companyRegNumber]
    ),
    pool.query<{ id: string; name: string; currency: string }>(
      `SELECT id, name, currency
       FROM accounts
       WHERE source = 'simulation' AND raw ->> 'company_reg_number' = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [companyRegNumber]
    ),
  ]);

  const summaryRow = summaryResult.rows[0];

  return {
    summary: {
      accounts: Number(summaryRow?.accounts ?? 0),
      balances: Number(summaryRow?.balances ?? 0),
      transactions: Number(summaryRow?.transactions ?? 0),
      alerts: Number(summaryRow?.alerts ?? 0),
    },
    account: accountResult.rows[0] ?? null,
  };
}

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
    const profile = await recordSmeProfile(req.user.id, result.dataset);
    const overview = await loadSimulationSummary(companyRegNumber);

    res.status(201).json({
      data: {
        dataset: result.dataset,
        account: overview.account ?? result.account,
        createdAt: profile.created_at,
        summary: overview.summary,
      },
    });
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

    const companyRegNumber = req.user.companyRegNumber?.trim();
    if (!companyRegNumber) {
      res.status(400);
      throw new Error('Company registration number missing');
    }

    const profile = await getLatestSmeProfile(req.user.id);
    if (!profile) {
      res.json({ data: null });
      return;
    }

    const overview = await loadSimulationSummary(companyRegNumber);

    res.json({
      data: {
        dataset: profile.dataset,
        createdAt: profile.created_at,
        account: overview.account,
        summary: overview.summary,
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
