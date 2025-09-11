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

export type TagRow = {
  id: number;
  name: string;
};

export async function containerExists(id: number): Promise<boolean> {
  const result = await db('containers').select('id').where({ id }).first();
  return !!result;
}

export async function imageExists(id: number): Promise<boolean> {
  const result = await db('images').select('id').where({ id }).first();
  return !!result;
}

export async function tagExists(id: number): Promise<boolean> {
  const result = await db('tags').select('id').where({ id }).first();
  return !!result;
}

export async function addImage(
  name: string
): Promise<ImageRow> {
  const [result] = await db('images')
    .insert({ name })
    .returning<ImageRow[]>('*');
  return result;
}

export async function addContainer(
  name: string,
  description = ''
): Promise<ContainerRow> {
  const [result] = await db('containers')
    .insert({ name, description })
    .returning<ContainerRow[]>('*');
  return result;
}

export async function addItem(data: {
  name: string;
  description?: string;
  container_id: number;
  image_id?: number | null;
}): Promise<ItemRow> {
  const [result] = await db('items')
    .insert({
      name: data.name,
      description: data.description ?? null,
      container_id: data.container_id,
      image_id: 'image_id' in data ? data.image_id ?? null : undefined,
    })
    .returning<ItemRow[]>('*');
  return result;
}

export async function addTag(
  name: string
): Promise<TagRow> {
  const [result] = await db('tags')
    .insert({ name })
    .returning<TagRow[]>('*');
  return result;
}

export async function getImage(
  id: number
): Promise<ImageRow | undefined> {
  return db('images')
    .select('id', 'name', 'created_at', 'updated_at')
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

export async function getTag(
  id: number
): Promise<TagRow | undefined> {
  return db('tags')
    .select('id', 'name')
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

export async function deleteTag(
  id: number
): Promise<void> {
  await db('tags').where({ id }).del();
}

export async function getAllImages(): Promise<ImageRow[]> {
  return db('images').select('id', 'name', 'created_at', 'updated_at');
}

export async function getAllContainers(): Promise<ContainerRow[]> {
  return db('containers').select('id', 'name', 'description');
}

export async function getAllItems(): Promise<ItemRow[]> {
  return db('items').select('id', 'name', 'description', 'container_id', 'image_id', 'created_at', 'updated_at');
}

export async function getAllTags(): Promise<TagRow[]> {
  return db('tags').select('id', 'name');
}

export async function getAllItemsByContainerId(
  containerId: number
): Promise<ItemRow[]> {
  return db('items')
    .select('id', 'name', 'description', 'container_id', 'image_id', 'created_at', 'updated_at')
    .where({ container_id: containerId });
}

export async function getAllItemsByTagId(
  tagId: number
): Promise<ItemRow[]> {
  return db('items as i')
    .join('items_to_tags as it', 'it.item_id', 'i.id')
    .where('it.tag_id', tagId)
    .distinct(
      'i.id',
      'i.name',
      'i.description',
      'i.container_id',
      'i.image_id',
      'i.created_at',
      'i.updated_at'
    );
}

export async function updateItem(
  id: number,
  patch: {
    name?: string;
    description?: string | null;
    container_id?: number;
    image_id?: number | null
  }
): Promise<ItemRow | undefined> {
  const [result] = await db('items')
    .where({ id })
    .update({
      ...patch,
      updated_at: db.fn.now()
    })
    .returning<ItemRow[]>('*');
  return result;
}