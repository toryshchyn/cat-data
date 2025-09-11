import { Router } from 'express';
import { checkJwt } from '../middlewares/checkJwt';
import { addContainer, deleteContainer, getAllContainers, getContainer } from '../db-functions';

const router = Router();

const asIntId = (v: string) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

router.get('/containers', checkJwt, async (req, res) => {
  try {
    const containers = await getAllContainers();
    res.status(200).json(Array.isArray(containers) ? containers : []);
  } catch (err) {
    console.error('GET /api/containers error:', err);
    res.status(500).json({ error: 'Failed to load containers.' });
  }
});

router.get('/container/:id', checkJwt, async (req, res): Promise<void> => {
  try {
    const id = asIntId(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid id.' });
      return;
    }

    const container = await getContainer(id);
    if (!container) {
      res.status(404).json({ error: 'Container not found.' });
      return;
    }

    res.status(200).json(container);
  } catch (e) {
    console.error('GET /api/containers/:id error:', e);
    res.status(500).json({ error: 'Failed to load container.' });
  }
});

router.post('/container', checkJwt, async (req, res): Promise<void> => {
  const name: string | undefined = req.body?.name;
  const description: string = req.body?.description ?? '';

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Name is required.' });
    return;
  }
  if (name.length > 255) {
    res.status(400).json({ error: 'Name must be ≤ 255 chars.' });
    return;
  }

  try {
    const created = await addContainer(name.trim(), description);
    res.status(201).json(created);
  } catch (e: any) {
    if (e?.code === '23505') {
      res.status(409).json({ error: 'Container name must be unique.' });
      return;
    }
    console.error('POST /api/containers error:', e);
    res.status(500).json({ error: 'Failed to create container.' });
  }
});

router.delete('/container/:id', checkJwt, async (req, res) => {
  try {
    const id = asIntId(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid id.' });
      return;
    }

    const exists = await getContainer(id);
    if (!exists) {
      res.status(404).json({ error: 'Container not found.' });
      return;
    }

    await deleteContainer(id);
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/container/:id error:', err);
    res.status(500).json({ error: 'International Server Error.' });
  }
});

export default router;