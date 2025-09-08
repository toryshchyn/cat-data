import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { checkJwt } from './middlewares/checkJwt';
import dotenv from 'dotenv';
import cors from 'cors';
import { addImage, deleteImage, getAllImages, getImage } from './db-functions';

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

    if (!req.file) {
      res.status(400).json({ error: 'Missing file to upload' });
      return;
    }

    const id = await addImage(req.file.filename);

    res.status(201).json({ id, filename: req.file.filename });
  }
);


app.delete('/api/image/:id', checkJwt, async (req, res) => {
  const id = Number(req.params.id);
  const fileInfo = await getImage(id);
  // delete file
  fs.unlinkSync(path.join(imagesDir, fileInfo.name));
  // delete from db
  await deleteImage(id);
  res.status(204).end();
});

app.get('/api/image/:id', checkJwt, async (req, res) => {
  const id = Number(req.params.id);
  const fileInfo = await getImage(id);
  res.sendFile(path.join(imagesDir, fileInfo.name));
});

app.get('/api/images', checkJwt, async (req, res) => {

  const images = await getAllImages();
  res.json(images);
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from CAT API');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});