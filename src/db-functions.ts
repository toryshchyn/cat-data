// src/insertCategory.ts
import pool from './db';

export async function insertCategory(name: string): Promise<void> {
  const result = await pool.query(
    'INSERT INTO categories("Name") VALUES ($1) RETURNING *',
    [name]
  );
  console.log('Inserted:', result.rows[0]);
}

export type Category = {
    id: number;
    name: string;
};
// get categories
export async function getCategories(): Promise<Category[]> {
  const result = await pool.query('SELECT * FROM categories');
  return result.rows;
}