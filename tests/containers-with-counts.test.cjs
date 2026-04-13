const test = require('node:test');
const assert = require('node:assert/strict');
const knexFactory = require('knex');
const rootConfig = require('../knexfile');
const appDb = require('../dist/db.js').default;

const db = knexFactory(rootConfig.development);

test('getContainersWithCounts includes zeros, all rows, and stable ordering', async (t) => {
  const { getContainersWithCounts } = require('../dist/db-functions.js');
  const stamp = Date.now();

  const containers = [
    { name: `test-cntr-a-${stamp}`, description: 'A' },
    { name: `test-cntr-b-${stamp}`, description: 'B' },
    { name: `test-cntr-c-${stamp}`, description: 'C' },
  ];

  let createdImageId;
  const createdContainerIds = [];
  const createdItemIds = [];

  await t.test('setup fixtures', async () => {
    const [image] = await db('images')
      .insert({ name: `test-img-${stamp}.jpg` })
      .returning(['id']);

    createdImageId = typeof image === 'object' ? image.id : image;

    const insertedContainers = await db('containers')
      .insert(containers)
      .returning(['id', 'name']);

    for (const row of insertedContainers) {
      createdContainerIds.push(typeof row === 'object' ? row.id : row);
    }

    const [c1, c2, c3] = createdContainerIds;

    const insertedItems = await db('items')
      .insert([
        { name: `test-item-1-${stamp}`, container_id: c1, image_id: createdImageId },
        { name: `test-item-2-${stamp}`, container_id: c1, image_id: createdImageId },
        { name: `test-item-3-${stamp}`, container_id: c3, image_id: createdImageId },
      ])
      .returning(['id']);

    for (const row of insertedItems) {
      createdItemIds.push(typeof row === 'object' ? row.id : row);
    }
    assert.equal(c2 > 0, true);
  });

  try {
    const result = await getContainersWithCounts();
    const byId = new Map(result.map((r) => [r.id, r]));
    const subset = createdContainerIds.map((id) => byId.get(id));

    assert.equal(subset.length, 3, 'includes all inserted containers');
    assert.ok(subset.every(Boolean), 'all inserted containers are present');

    const [first, second, third] = subset;
    assert.equal(first.count, 2, 'first container count should be 2');
    assert.equal(second.count, 0, 'empty container count should be 0');
    assert.equal(third.count, 1, 'third container count should be 1');

    const names = subset.map((row) => row.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    assert.deepEqual(names, sorted, 'ordering should be deterministic by name asc');
  } finally {
    if (createdItemIds.length > 0) {
      await db('items').whereIn('id', createdItemIds).del();
    }
    if (createdContainerIds.length > 0) {
      await db('containers').whereIn('id', createdContainerIds).del();
    }
    if (createdImageId) {
      await db('images').where({ id: createdImageId }).del();
    }
  }
});

test.after(async () => {
  await db.destroy();
  await appDb.destroy();
});
