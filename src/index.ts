import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import imagesRouter from './routes/images_routes';
import containersRouter from './routes/containers_routes';
import itemsRouter from './routes/items_routes';
import tagsRouter from './routes/tags_routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from CAT API');
});

app.use('/api', imagesRouter);
app.use('/api', containersRouter);
app.use('/api', itemsRouter);
app.use('/api', tagsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});