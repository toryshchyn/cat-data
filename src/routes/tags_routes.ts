import { Router } from 'express';
import { checkJwt } from '../middlewares/checkJwt';
import { getAllTags, getTag, addTag, deleteTag } from '../db-functions';

const router = Router();

const asIntId = (v: string) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

router.get('/tags', checkJwt, async (_req, res) => {
  try {
    const tags = await getAllTags();
    res.status(200).json(Array.isArray(tags) ? tags : []);
  } catch (err) {
    console.error('GET /api/tags error:', err);
    res.status(500).json({ error: 'Failed to load tags.' });
  }
});

router.get('/tag/:id', checkJwt, async (req, res): Promise<void> => {
  try {
    const id = asIntId(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid id.' });
      return;
    }

    const tag = await getTag(id);
    if (!tag) {
      res.status(404).json({ error: 'Tag not found.' });
      return;
    }

    res.status(200).json(tag);
  } catch (err) {
    console.error('GET /api/tag/:id error:', err);
    res.status(500).json({ error: 'Failed to load tag.' });
  }
});

router.post('/tag', checkJwt, async (req, res): Promise<void> => {
  const name: string | undefined = req.body?.name;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Name is required.' });
    return;
  }
  if (name.length > 255) {
    res.status(400).json({ error: 'Name must be ≤ 255 chars.' });
    return;
  }

  try {
    const created = await addTag(name.trim());
    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === '23505') {
      res.status(409).json({ error: 'Tag name must be unique.' });
      return;
    }
    console.error('POST /api/tag error:', err);
    res.status(500).json({ error: 'Failed to create tag.' });
  }
});

router.delete('/tag/:id', checkJwt, async (req, res) => {
  try {
    const id = asIntId(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid id.' });
      return;
    }

    const exists = await getTag(id);
    if (!exists) {
      res.status(404).json({ error: 'Tag not found.' });
      return;
    }

    await deleteTag(id);
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/tag/:id error:', err);
    res.status(500).json({ error: 'Failed to delete tag.' });
  }
});

export default router;