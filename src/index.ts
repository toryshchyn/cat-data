import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { checkJwt } from './middlewares/checkJwt';
import dotenv from 'dotenv';
import cors from 'cors';
import { createContainerContentImageItem, deleteContainerContentImageItem, getCategories, getContainerContentImageItem, getContainerContentImageItems, getContainers } from './db-functions';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

//files upload
const imagesDir = path.join(__dirname, '../images');
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

const upload = multer({ storage, fileFilter });

app.post(
  '/api/upload',
  checkJwt,
  upload.single('file'),
  async (req, res): Promise<void> => {
    const containerId = Number(req.body.containerId);

    if (!req.file || isNaN(containerId)) {
      res.status(400).json({ error: 'Missing file or invalid containerId' });
      return;
    }

    const id = await createContainerContentImageItem(containerId, req.file.filename);

    res.status(201).json({ id, filename: req.file.filename });
  }
);


app.delete('/api/image/:id', checkJwt, async (req, res) => {
  const id = Number(req.params.id);
  const fileInfo = await getContainerContentImageItem(id);
  // delete file
  fs.unlinkSync(path.join(imagesDir, fileInfo.filename));
  // delete from db
  await deleteContainerContentImageItem(id);
  res.status(204).end();
});

app.get('/api/image/:id', checkJwt, async (req, res) => {
  const id = Number(req.params.id);
  const fileInfo = await getContainerContentImageItem(id);
  res.sendFile(path.join(imagesDir, fileInfo.filename));
});

app.get('/api/container-images', checkJwt, async (req, res) => {
  const containerId = Number(req.query.containerId);
  if (isNaN(containerId)) {
    res.status(400).json({ error: 'Invalid containerId' });
    return;
  }

  const images = await getContainerContentImageItems(containerId);
  res.json(images);
});
// end of files upload


app.get('/', (req: Request, res: Response) => {
  res.send('Hello from CAT API');
});

app.get('/api/containers', checkJwt, async (req: Request, res: Response) => {
  const containers = await getContainers();
  res.json(containers);
});

app.get('/api/phone-numbers', checkJwt, (req: Request, res: Response) => {
  res.json([{number: '123-456-7890', idKey: 1}, {number: '098-765-4321', idKey: 2}]); 
});

// DB functions
app.get('/api/categories', async (req: Request, res: Response) => {
  const categories = await getCategories();
  res.json(categories);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});