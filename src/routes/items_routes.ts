import { Router } from 'express';
import { checkJwt } from '../middlewares/checkJwt';
import { containerExists, imageExists, addItem, deleteItem, getAllItems, getItem } from '../db-functions';

const router = Router();

const asIntId = (v: string) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

router.get('/items', checkJwt, async (req, res) => {
  try {
    const items = await getAllItems();
    res.status(200).json(Array.isArray(items) ? items : []);
  } catch (err) {
    console.error('GET /api/items error:', err);
    res.status(500).json({ error: 'Failed to fetch items.' });
  }
});

router.get('/item/:id', checkJwt, async (req, res): Promise<void> => {
  try {
    const id = asIntId(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid id.' });
      return;
    }

    const item = await getItem(id);
    if (!item) {
      res.status(404).json({ error: 'Item not found.' });
      return;
    }

    res.status(200).json(item);
  } catch (e) {
    console.error('GET /api/items/:id error:', e);
    res.status(500).json({ error: 'Failed to load item.' });
  }
});

router.post('/item', checkJwt, async (req, res): Promise<void> => {
  const name: string | undefined = req.body?.name;
  const description: string | undefined = req.body?.description;
  const container_id = asIntId(String(req.body?.container_id ?? ''));
  const image_id = req.body?.image_id !== undefined ? asIntId(String(req.body.image_id)) : undefined;

  if (!name || !name.trim()) { res.status(400).json({ error: 'Name is required.' }); return; }
  if (!container_id) { res.status(400).json({ error: 'container_id is required and must be a positive integer.' }); return; }

  try {
    if (!(await containerExists(container_id))) {
      res.status(400).json({ error: 'container_id does not exist.' });
      return;
    }
    if (image_id !== undefined && image_id !== null) {
      if (!image_id || !(await imageExists(image_id))) {
        res.status(400).json({ error: 'image_id does not exist.' });
        return;
      }
    }

    const created = await addItem({
      name: name.trim(),
      description,
      container_id,
      image_id: image_id ?? null,
    });
    res.status(201).json(created);
  } catch (e: any) {
    if (e?.code === '23505') { res.status(409).json({ error: 'Item name must be unique.' }); return; }
    console.error('POST /api/items error:', e);
    res.status(500).json({ error: 'Failed to create item.' });
  }
});

router.delete('/item/:id', checkJwt, async (req, res): Promise<void> => {
  try {
    const id = asIntId(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid id.' });
      return;
    }

    const exists = await getItem(id);
    if (!exists) {
      res.status(404).json({ error: 'Item not found.' });
      return;
    }

    await deleteItem(id);
    res.status(204).end();
  } catch (e) {
    console.error('DELETE /api/items/:id error:', e);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
});

export default router;
