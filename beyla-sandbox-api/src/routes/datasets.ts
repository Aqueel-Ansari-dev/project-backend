import { Router } from 'express';

import { fetchNayaOneDataset } from '../services/nayaone.js';

const router = Router();

router.get('/nayaone', async (req, res, next) => {
  try {
    const offsetParam = req.query.offset ? Number(req.query.offset) : 0;
    if (!Number.isFinite(offsetParam) || offsetParam < 0 || offsetParam % 10 !== 0) {
      res.status(400);
      throw new Error('offset must be a non-negative multiple of 10');
    }

    const limitParam = req.query.limit ? Number(req.query.limit) : 10;
    if (!Number.isFinite(limitParam) || limitParam <= 0 || limitParam > 100) {
      res.status(400);
      throw new Error('limit must be a positive number up to 100');
    }

    const { records } = await fetchNayaOneDataset({
      offset: offsetParam,
      limit: limitParam,
    });

    const nextOffset = records.length === limitParam ? offsetParam + limitParam : null;

    res.json({
      data: {
        records,
        offset: offsetParam,
        limit: limitParam,
        nextOffset,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
