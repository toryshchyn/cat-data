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

export async function isContainerExists(id: number): Promise<boolean> {
  const result = await db('containers').select('id').where({ id }).first();
  return !!result;
}

export async function isImageExists(id: number): Promise<boolean> {
  const result = await db('images').select('id').where({ id }).first();
  return !!result;
}

export async function isTagExists(id: number): Promise<boolean> {
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
      image_id: data.image_id ?? null,
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

export async function getImageById(
  id: number
): Promise<ImageRow | undefined> {
  return db('images')
    .select('id', 'name', 'created_at', 'updated_at')
    .where({ id })
    .first();
}

export async function getContainerById(
  id: number
): Promise<ContainerRow | undefined> {
  return db('containers')
    .select('id', 'name', 'description')
    .where({ id })
    .first();
}

export async function getItemById(
  id: number
): Promise<(ItemRow & { tags: number[] }) | undefined> {
  const item = await db('items')
    .select(
      'id',
      'name',
      'description',
      'container_id',
      'image_id',
      'created_at',
      'updated_at'
    )
    .where({ id })
    .first();

  if (!item) {
    return undefined;
  }

  const tags = await db('items_to_tags')
    .where({ item_id: id })
    .pluck('tag_id');

  return {
    ...item,
    tags,
  };
}


export async function getTagById(
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

export async function getImages(): Promise<ImageRow[]> {
  return db('images').select('id', 'name', 'created_at', 'updated_at');
}

export async function getContainers(): Promise<ContainerRow[]> {
  return db('containers').select('id', 'name', 'description');
}

export async function getItems(): Promise<ItemRow[]> {
  return db('items').select('id', 'name', 'description', 'container_id', 'image_id', 'created_at', 'updated_at');
}

export async function getTags(): Promise<TagRow[]> {
  return db('tags').select('id', 'name');
}

export async function getItemsByContainerId(
  containerId: number
): Promise<ItemRow[]> {
  return db('items')
    .select('id', 'name', 'description', 'container_id', 'image_id', 'created_at', 'updated_at')
    .where({ container_id: containerId });
}

export async function getItemsByTagId(
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

export async function addItemWithTags(data: {
  name: string;
  description?: string;
  container_id: number;
  image_id?: number | null;
  tags?: number[];
}): Promise<ItemRow> {
  return await db.transaction(async (trx) => {
    const [item] = await trx('items')
      .insert({
        name: data.name,
        description: data.description ?? null,
        container_id: data.container_id,
        image_id: data.image_id ?? null,
      })
      .returning<ItemRow[]>('*');

    if (data.tags && data.tags.length > 0) {
      const tagsToInsert = data.tags.map((tagId) => ({
        item_id: item.id,
        tag_id: tagId,
      }));
      await trx('items_to_tags').insert(tagsToInsert);
    }

    return item;
  });
}

export async function updateItemWithTags(
  id: number,
  patch: {
    name?: string;
    description?: string | null;
    container_id?: number;
    image_id?: number | null;
    tags?: number[];
  }
): Promise<ItemRow | undefined> {
  return db.transaction(async (trx) => {
    const [result] = await trx('items')
      .where({ id })
      .update({
        name: patch.name,
        description: patch.description ?? null,
        container_id: patch.container_id,
        image_id: patch.image_id ?? null,
        updated_at: db.fn.now()
      })
      .returning<ItemRow[]>('*');

    if (patch.tags) {
      await trx('items_to_tags').where({ item_id: id }).del();

      if (patch.tags.length > 0) {
        const tagsToInsert = patch.tags.map(tagId => ({
          item_id: id,
          tag_id: tagId
        }));
        await trx('items_to_tags').insert(tagsToInsert);
      }
    }

    return result;
  });
}