import { Router } from 'express';

import { fetchNayaOneDataset, NayaOneRequestError } from '../services/nayaone.js';

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
    if (err instanceof NayaOneRequestError) {
      res.status(err.status >= 400 ? err.status : 502);
      const message = err.body?.trim()
        ? 'Upstream dataset is temporarily unavailable. Please retry shortly.'
        : err.message;
      next(new Error(message));
      return;
    }
    next(err);
  }
});

export default router;
