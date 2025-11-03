import { Router } from 'express';

const router = Router();

router.get('/live', (_req, res) => {
  res.json({ status: 'live' });
});

router.get('/ready', (_req, res) => {
  res.json({ status: 'ready' });
});

export default router;
