import db from './db';

export type ImageRow = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type ContainerRow = {
  id: number;
  name: string;
  description: string | null;
};

export type ItemRow = {
  id: number;
  name: string;
  description: string | null;
  container_id: number;
  image_id: number | null;
  created_at: string;
  updated_at: string;
};

export async function containerExists(id: number): Promise<boolean> {
  const row = await db('containers').select('id').where({ id }).first();
  return !!row;
}

export async function imageExists(id: number): Promise<boolean> {
  const row = await db('images').select('id').where({ id }).first();
  return !!row;
}

export async function addImage(
  name: string
): Promise<number> {
  const [result] = await db('images')
    .insert({ name })
    .returning<{ id: number }[]>('id');
  return result.id;
}

export async function addContainer(
  name: string,
  description = ''
): Promise<ContainerRow> {
  const [row] = await db('containers')
    .insert({ name, description })
    .returning<ContainerRow[]>('*');
  return row;
}

export async function addItem(data: {
  name: string;
  description?: string;
  container_id: number;
  image_id?: number | null;
}): Promise<ItemRow> {
  const payload: any = {
    name: data.name,
    description: data.description ?? null,
    container_id: data.container_id,
  };
  if ('image_id' in data) payload.image_id = data.image_id ?? null;

  const [row] = await db('items').insert(payload).returning<ItemRow[]>('*');
  return row;
}

export async function getImage(
  id: number
): Promise<ImageRow | undefined> {
  return db('images')
    .select('id', 'name')
    .where({ id })
    .first();
}

export async function getContainer(
  id: number
): Promise<ContainerRow | undefined> {
  return db('containers')
    .select('id', 'name', 'description')
    .where({ id })
    .first();
}

export async function getItem(
  id: number
): Promise<ItemRow | undefined> {
  return db('items')
    .select('id', 'name', 'description', 'container_id', 'image_id', 'created_at', 'updated_at')
    .where({ id })
    .first();
}

export async function deleteImage(
  id: number
): Promise<void> {
  await db('images').where({ id }).del();
}

export async function deleteContainer(
  id: number
): Promise<void> {
  await db('containers').where({ id }).del();
}

export async function deleteItem(
  id: number
): Promise<void> {
  await db('items').where({ id }).del();
}

export async function getAllImages(): Promise<ImageRow[]> {
  return db('images').select('id', 'name');
}

export async function getAllContainers(): Promise<ContainerRow[]> {
  return db('containers').select('id', 'name', 'description');
}

export async function getAllItems(): Promise<ItemRow[]> {
  return db('items').select('id', 'name', 'description', 'container_id', 'image_id');
}