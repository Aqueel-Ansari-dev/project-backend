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

    const { records } = await fetchNayaOneDataset(offsetParam);

    const pageSize = records.length;
    const nextOffset = pageSize === 0 ? null : offsetParam + pageSize;

    res.json({
      data: {
        records,
        offset: offsetParam,
        pageSize,
        nextOffset,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
