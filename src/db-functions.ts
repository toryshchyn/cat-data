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

export async function createContainerContentImageItem(
    containerId: number,
    filename: string
  ): Promise<number> {
    const result = await pool.query(
      'INSERT INTO images("container-id", filename) VALUES ($1, $2) RETURNING id',
      [containerId, filename]
    );
  
    return result.rows[0].id;
}

export async function getContainerContentImageItem(
    id: number
  ): Promise<{ id: number; filename: string }> {
    const result = await pool.query(
      'SELECT id, filename FROM images WHERE "id" = $1',
      [id]
    );
  
    return result.rows[0];
}

export async function deleteContainerContentImageItem(id: number): Promise<void> {
  await pool.query('DELETE FROM images WHERE "id" = $1', [id]);
}

export async function getContainerContentImageItems(
    containerId: number
  ): Promise<{ id: number; filename: string }[]> {
    const result = await pool.query(
      'SELECT id, filename FROM images WHERE "container-id" = $1',
      [containerId]
    );
  
    return result.rows;
}

export async function getContainers(): Promise<{ id: number; name: string, key: string, info?: string }[]> {
  const result = await pool.query('SELECT id, name, key, info FROM containers;');
  return result.rows;
}