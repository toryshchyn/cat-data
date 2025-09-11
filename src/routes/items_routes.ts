import { Router } from 'express';
import { checkJwt } from '../middlewares/checkJwt';
import * as db from '../db-functions';

const router = Router();

const asIntId = (v: string) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

router.get('/items', checkJwt, async (req, res) => {
  try {
    const items = await db.getAllItems();
    res.status(200).json(Array.isArray(items) ? items : []);
  } catch (err) {
    console.error('GET /api/items error:', err);
    res.status(500).json({ error: 'Failed to load items.' });
  }
});

router.get('/item/:id', checkJwt, async (req, res): Promise<void> => {
  try {
    const id = asIntId(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid id.' });
      return;
    }

    const item = await db.getItem(id);
    if (!item) {
      res.status(404).json({ error: 'Item not found.' });
      return;
    }

    res.status(200).json(item);
  } catch (err) {
    console.error('GET /api/item/:id error:', err);
    res.status(500).json({ error: 'Failed to load item.' });
  }
});

router.post('/item', checkJwt, async (req, res): Promise<void> => {
  const name: string | undefined = req.body?.name;
  const description: string | undefined = req.body?.description;
  const container_id = asIntId(String(req.body?.container_id ?? ''));
  const image_id = req.body?.image_id !== undefined ? asIntId(String(req.body.image_id)) : undefined;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Name is required.' });
    return;
  }
  if (!container_id) {
    res.status(400).json({ error: 'container_id is required and must be a positive integer.' });
    return;
  }

  try {
    if (!(await db.containerExists(container_id))) {
      res.status(400).json({ error: 'container_id does not exist.' });
      return;
    }
    if (image_id !== undefined && image_id !== null) {
      if (!image_id || !(await db.imageExists(image_id))) {
        res.status(400).json({ error: 'image_id does not exist.' });
        return;
      }
    }

    const created = await db.addItem({
      name: name.trim(),
      description,
      container_id,
      image_id: image_id ?? null,
    });
    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === '23505') { res.status(409).json({ error: 'Item name must be unique.' }); return; }
    console.error('POST /api/item error:', err);
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

    const exists = await db.getItem(id);
    if (!exists) {
      res.status(404).json({ error: 'Item not found.' });
      return;
    }

    await db.deleteItem(id);
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/item/:id error:', err);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
});

router.get('/items/by-container/:id', checkJwt, async (req, res): Promise<void> => {
  const containerId = asIntId(req.params.containerId);
  if (!containerId) {
    res.status(400).json({ error: 'Invalid container id.' });
    return;
  }

  try {
    if (!(await db.containerExists(containerId))) {
      res.status(404).json({ error: 'Container not found.' });
      return;
    }
    const result = await db.getAllItemsByContainerId(containerId);
    res.json(Array.isArray(result) ? result : []);
  } catch (err) {
    console.error('GET /api/items/by-container/:id error:', err);
    res.status(500).json({ error: 'Failed to load items.' });
  }
});

router.get('/items/by-tag/:id', checkJwt, async (req, res): Promise<void> => {
  const tagId = asIntId(req.params.tagId);
  if (!tagId) {
    res.status(400).json({ error: 'Invalid tag id.' });
    return;
  }

  try {
    if (!(await db.tagExists(tagId))) {
      res.status(404).json({ error: 'Tag not found.' });
      return;
    }
    const result = await db.getAllItemsByTagId(tagId);
    res.json(Array.isArray(result) ? result : []);
  } catch (err) {
    console.error('GET /api/items/by-tag/:id error:', err);
    res.status(500).json({ error: 'Failed to load items.' });
  }
});

router.put('/item/:id', checkJwt, async (req, res): Promise<void> => {
  const id = asIntId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid id.' });
    return;
  }

  const has = (k: string) => Object.prototype.hasOwnProperty.call(req.body ?? {}, k);

  if (!has('name') || !has('container_id') || !has('description') || !has('image_id')) {
    res.status(400).json({ error: 'PUT requires name, container_id, description, image_id.' });
    return;
  }

  const rawName = req.body.name;
  if (typeof rawName !== 'string' || !rawName.trim()) {
    res.status(400).json({ error: 'Name is required.' });
    return;
  }

  const container_id = asIntId(String(req.body.container_id));
  if (!container_id) {
    res.status(400).json({ error: 'container_id must be a positive integer.' });
    return;
  }

  const description = req.body.description === null ? null : String(req.body.description);
  let image_id: number | null;
  if (req.body.image_id === null) image_id = null;
  else {
    const img = asIntId(String(req.body.image_id));
    if (!img) { res.status(400).json({ error: 'image_id must be null or a positive integer.' }); return; }
    image_id = img;
  }

  try {
    const exists = await db.getItem(id);
    if (!exists) { res.status(404).json({ error: 'Item not found.' }); return; }

    if (!(await db.containerExists(container_id))) {
      res.status(400).json({ error: 'container_id does not exist.' });
      return;
    }
    if (image_id !== null && !(await db.imageExists(image_id))) {
      res.status(400).json({ error: 'image_id does not exist.' });
      return;
    }

    const updated = await db.updateItem(id, {
      name: rawName.trim(),
      description,
      container_id,
      image_id
    });

    res.json(updated);
  } catch (err: any) {
    if (err?.code === '23505') { res.status(409).json({ error: 'Item name must be unique.' }); return; }
    console.error('PUT /api/item/:id error:', err);
    res.status(500).json({ error: 'Failed to replace item.' });
  }
});

router.patch('/item/:id', checkJwt, async (req, res): Promise<void> => {
  const id = asIntId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid id.' });
    return;
  }

  const patch: { name?: string; description?: string | null; container_id?: number; image_id?: number | null } = {};

  if (req.body?.name !== undefined) {
    if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
      res.status(400).json({ error: 'Name cannot be empty.' });
      return;
    }
    patch.name = req.body.name.trim();
  }

  if (req.body?.description !== undefined) {
    patch.description = req.body.description === null ? null : String(req.body.description);
  }

  if (req.body?.container_id !== undefined) {
    const cid = asIntId(String(req.body.container_id));
    if (!cid) { res.status(400).json({ error: 'Invalid container_id.' }); return; }
    if (!(await db.containerExists(cid))) { res.status(400).json({ error: 'container_id does not exist.' }); return; }
    patch.container_id = cid;
  }

  if (req.body?.image_id !== undefined) {
    if (req.body.image_id === null) {
      patch.image_id = null;
    } else {
      const imgId = asIntId(String(req.body.image_id));
      if (!imgId) { res.status(400).json({ error: 'Invalid image_id.' }); return; }
      if (!(await db.imageExists(imgId))) { res.status(400).json({ error: 'image_id does not exist.' }); return; }
      patch.image_id = imgId;
    }
  }

  if (!Object.keys(patch).length) { res.status(400).json({ error: 'Nothing to update.' }); return; }

  try {
    const updated = await db.updateItem(id, patch);
    if (!updated) { res.status(404).json({ error: 'Item not found.' }); return; }
    res.json(updated);
  } catch (err: any) {
    if (err?.code === '23505') { res.status(409).json({ error: 'Item name must be unique.' }); return; }
    console.error('PATCH /api/item/:id error:', err);
    res.status(500).json({ error: 'Failed to update item.' });
  }
});

export default router;
