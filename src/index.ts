import express, { Request, Response } from 'express';
import { checkJwt } from './middlewares/checkJwt';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './db';
import { getCategories } from './db-functions';

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

app.get('/api/containers', (req: Request, res: Response) => {
  res.json([{size: 10, name: 'container1', idKey: 1}, {size: 20, name: 'container2', idKey: 2}]); 
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