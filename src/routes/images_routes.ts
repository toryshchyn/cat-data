import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { checkJwt } from '../middlewares/checkJwt';
import { addImage, deleteImage, getAllImages, getImage } from '../db-functions';

const router = Router();

const imagesDir = path.resolve(process.cwd(), 'images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG and PNG files are allowed.'));
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => cb(null, uuidv4() + '-' + file.originalname),
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

const asIntId = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const getContentType = (filename: string) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
};

router.post(
  '/image',
  checkJwt,
  (req, res, next) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File too large (max 10MB).' });
        }
        return res.status(415).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Missing file to upload.' });
        return;
      }

      const absPath = path.join(imagesDir, req.file.filename);
      if (!fs.existsSync(absPath)) {
        res.status(500).json({ error: 'File not found on disk after upload.' });
        return;
      }

      const id = await addImage(req.file.filename);

      res
        .status(201)
        .location(`/api/image/${id}`)
        .json({ id, filename: req.file.filename });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

router.delete('/image/:id', checkJwt, async (req, res) => {
  try {
    const id = asIntId(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Invalid id.' });
      return;
    }

    const fileInfo = await getImage(id);
    if (!fileInfo) {
      res.status(404).json({ error: 'Image not found.' });
      return;
    }

    await deleteImage(id);
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/image/:id error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/image/:id', checkJwt, async (req, res) => {
  const id = asIntId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid id.' });
    return;
  }

  const fileInfo = await getImage(id);
  if (!fileInfo) {
    res.status(404).json({ error: 'Image not found.' });
    return;
  }

  const absPath = path.join(imagesDir, fileInfo.name);

  res.setHeader('Content-Type', getContentType(fileInfo.name));
  res.sendFile(absPath);
});

router.get('/images', checkJwt, async (req, res) => {
  try {
    const images = await getAllImages();
    res.status(200).json(Array.isArray(images) ? images : []);
  } catch (err) {
    console.error('GET /api/images error:', err);
    res.status(500).json({ error: 'Failed to fetch images.' });
  }
});

export default router;