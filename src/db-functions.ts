import db from './db';

export async function addImage(
  name: string
): Promise<number> {
  const [result] = await db('images')
    .insert({ name })
    .returning('id');

  return result.id ?? result;
}

export async function getImage(
  id: number
): Promise<{ id: number; name: string }> {
  const row = await db('images')
    .select('id', 'name')
    .where({ id })
    .first();

  return row;
}

export async function deleteImage(id: number): Promise<void> {
  await db('images').where({ id }).del();
}

export async function getAllImages(): Promise<{ id: number; name: string }[]> {
  return db('images').select('id', 'name');
}