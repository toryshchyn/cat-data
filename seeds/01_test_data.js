const path = require('path');
const fs = require('fs');

/** https://picsum.photos — same seed → same image on each run. */
const PICSUM_BASE = 'https://picsum.photos';

const SEED_IMAGE_SPECS = [
  { name: 'seed-img-aurora.jpg', seed: 'catdata-aurora', width: 400, height: 300 },
  { name: 'seed-img-blizzard.jpg', seed: 'catdata-blizzard', width: 400, height: 300 },
  { name: 'seed-img-coral.jpg', seed: 'catdata-coral', width: 400, height: 300 },
  { name: 'seed-img-dusk.jpeg', seed: 'catdata-dusk', width: 400, height: 300 },
  { name: 'seed-img-echo.jpg', seed: 'catdata-echo', width: 400, height: 300 },
  { name: 'seed-img-fjord.jpg', seed: 'catdata-fjord', width: 400, height: 300 },
];

/**
 * @param { string } picsumUrl
 * @param { string } destPath
 */
async function downloadBinary(picsumUrl, destPath) {
  const res = await fetch(picsumUrl, {
    redirect: 'follow',
    headers: {
      Accept: 'image/*',
      'User-Agent': 'CatData-knex-seed/1.0 (picsum.photos)',
    },
  });
  if (!res.ok) {
    throw new Error(`Picsum request failed (${res.status} ${res.statusText}): ${picsumUrl}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) {
    throw new Error(`Empty response from Picsum: ${picsumUrl}`);
  }
  fs.writeFileSync(destPath, buf);
}

async function downloadSeedImagesToDisk() {
  const imagesDir = path.resolve(process.cwd(), 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  for (const { name, seed, width, height } of SEED_IMAGE_SPECS) {
    const url = `${PICSUM_BASE}/seed/${encodeURIComponent(seed)}/${width}/${height}`;
    await downloadBinary(url, path.join(imagesDir, name));
  }
}

/**
 * Test data: 3–10 rows per table (FK-safe order).
 * Downloads seed photos from picsum.photos into ./images (requires network).
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('items_to_tags').del();
  await knex('items').del();
  await knex('tags').del();
  await knex('images').del();
  await knex('containers').del();

  await downloadSeedImagesToDisk();

  const containerRows = await knex('containers')
    .insert([
      { name: 'seed-cntr-alpha', description: 'Shelf unit A' },
      { name: 'seed-cntr-beta', description: 'Drawer stack B' },
      { name: 'seed-cntr-gamma', description: 'Bin rack C' },
      { name: 'seed-cntr-delta', description: 'Cabinet D' },
      { name: 'seed-cntr-epsilon', description: 'Loft box E' },
    ])
    .returning('id');

  const imageRows = await knex('images')
    .insert(SEED_IMAGE_SPECS.map(({ name }) => ({ name })))
    .returning('id');

  const tagRows = await knex('tags')
    .insert([
      { name: 'seed-tag-archived' },
      { name: 'seed-tag-fragile' },
      { name: 'seed-tag-hardware' },
      { name: 'seed-tag-paper' },
      { name: 'seed-tag-research' },
      { name: 'seed-tag-staging' },
      { name: 'seed-tag-textile' },
      { name: 'seed-tag-vintage' },
    ])
    .returning('id');

  const cid = (row) => (row && typeof row === 'object' ? row.id : row);
  const containerIds = containerRows.map(cid);
  const imageIds = imageRows.map(cid);
  const tagIds = tagRows.map(cid);

  const itemRows = await knex('items')
    .insert([
      {
        name: 'seed-item-antique-vase',
        description: 'Ceramic vase',
        image_id: imageIds[0],
        container_id: containerIds[0],
      },
      {
        name: 'seed-item-blueprint-roll',
        description: 'Rolled architectural plans',
        image_id: imageIds[1],
        container_id: containerIds[1],
      },
      {
        name: 'seed-item-brass-compass',
        description: 'Pocket compass',
        image_id: imageIds[2],
        container_id: containerIds[2],
      },
      {
        name: 'seed-item-field-journal',
        description: 'Leather-bound notes',
        image_id: imageIds[3],
        container_id: containerIds[3],
      },
      {
        name: 'seed-item-glass-slide',
        description: 'Microscopy slide set',
        image_id: imageIds[4],
        container_id: containerIds[4],
      },
      {
        name: 'seed-item-linen-sample',
        description: 'Fabric swatch book',
        image_id: imageIds[5],
        container_id: containerIds[0],
      },
      {
        name: 'seed-item-map-atlas',
        description: 'Regional atlas',
        image_id: imageIds[0],
        container_id: containerIds[1],
      },
    ])
    .returning('id');

  const itemIds = itemRows.map(cid);

  await knex('items_to_tags').insert([
    { item_id: itemIds[0], tag_id: tagIds[0] },
    { item_id: itemIds[0], tag_id: tagIds[7] },
    { item_id: itemIds[1], tag_id: tagIds[3] },
    { item_id: itemIds[1], tag_id: tagIds[4] },
    { item_id: itemIds[2], tag_id: tagIds[2] },
    { item_id: itemIds[2], tag_id: tagIds[6] },
    { item_id: itemIds[3], tag_id: tagIds[4] },
    { item_id: itemIds[4], tag_id: tagIds[1] },
    { item_id: itemIds[4], tag_id: tagIds[5] },
    { item_id: itemIds[5], tag_id: tagIds[6] },
  ]);
};
