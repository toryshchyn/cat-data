const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const knexFactory = require('knex');
const rootConfig = require('../knexfile');
const appDb = require('../dist/db.js').default;

const db = knexFactory(rootConfig.development);

test('item name suggestions/search are case-insensitive and stable', async () => {
  const { getItemNameSuggestions, searchItemsByName, searchItemsByText } = require('../dist/db-functions.js');
  const stamp = Date.now();

  let imageId;
  let containerId;
  let secondContainerId;
  let tagId;
  const itemIds = [];

  try {
    const [image] = await db('images')
      .insert({ name: `test-search-img-${stamp}.jpg` })
      .returning(['id']);
    imageId = typeof image === 'object' ? image.id : image;

    const [container] = await db('containers')
      .insert({ name: `test-search-container-${stamp}`, description: 'search fixtures' })
      .returning(['id']);
    containerId = typeof container === 'object' ? container.id : container;

    const [secondContainer] = await db('containers')
      .insert({ name: `test-search-container-2-${stamp}`, description: 'search fixtures 2' })
      .returning(['id']);
    secondContainerId = typeof secondContainer === 'object' ? secondContainer.id : secondContainer;

    const [tag] = await db('tags')
      .insert({ name: `Label ${stamp}` })
      .returning(['id']);
    tagId = typeof tag === 'object' ? tag.id : tag;

    const insertedItems = await db('items')
      .insert([
        { name: `Alpha ${stamp}`, container_id: containerId, image_id: imageId },
        { name: `alpha bolt ${stamp}`, container_id: containerId, image_id: imageId },
        { name: `Xalpha suffix ${stamp}`, container_id: containerId, image_id: imageId, description: `Contains ${stamp}` },
        { name: `Bolt outside ${stamp}`, container_id: secondContainerId, image_id: imageId, description: `From container ${secondContainerId}` },
      ])
      .returning(['id']);
    for (const row of insertedItems) {
      itemIds.push(typeof row === 'object' ? row.id : row);
    }

    const q = 'ALPHA';
    const suggestions = await getItemNameSuggestions(q, 20);
    const filteredSuggestions = suggestions.filter((name) => name.includes(String(stamp)));

    assert.ok(filteredSuggestions.length >= 3, 'returns partial matches');
    assert.equal(new Set(filteredSuggestions).size, filteredSuggestions.length, 'no duplicates in suggestions');
    assert.ok(filteredSuggestions[0].toLowerCase().startsWith('alpha'), 'starts-with ranked first');

    const searchResults = await searchItemsByName(q, 20);
    const filteredResults = searchResults.filter((row) => row.name.includes(String(stamp)));
    assert.ok(filteredResults.length >= 3, 'search returns matching rows');
    assert.ok(filteredResults.every((row) => typeof row.containerName === 'string'), 'containerName is included');

    const blankSuggestions = await getItemNameSuggestions(' ', 20);
    const shortSearch = await searchItemsByName('a', 20);
    assert.deepEqual(blankSuggestions, [], 'blank query returns empty suggestions');
    assert.deepEqual(shortSearch, [], 'too-short search query returns empty array');

    await db('items_to_tags').insert({ item_id: itemIds[0], tag_id: tagId });

    const byTagName = await searchItemsByText(`label ${stamp}`, { limit: 20 });
    assert.ok(byTagName.some((row) => row.id === itemIds[0]), 'text search matches by tag name');

    const byDescription = await searchItemsByText(`contains ${stamp}`, { limit: 20 });
    assert.ok(byDescription.some((row) => row.id === itemIds[2]), 'text search matches by description');

    const byContainer = await searchItemsByText(`bolt ${stamp}`, { containerId, limit: 20 });
    assert.ok(byContainer.every((row) => row.container_id === containerId), 'container filter limits results');
  } finally {
    if (itemIds.length) {
      await db('items_to_tags').whereIn('item_id', itemIds).del();
    }
    if (tagId) {
      await db('tags').where({ id: tagId }).del();
    }
    if (itemIds.length) {
      await db('items').whereIn('id', itemIds).del();
    }
    if (secondContainerId) {
      await db('containers').where({ id: secondContainerId }).del();
    }
    if (containerId) {
      await db('containers').where({ id: containerId }).del();
    }
    if (imageId) {
      await db('images').where({ id: imageId }).del();
    }
  }
});

test('search endpoints are protected by checkJwt middleware', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'routes', 'items_routes.ts'),
    'utf8'
  );

  assert.match(
    source,
    /router\.get\('\/items\/name-suggestions',\s*checkJwt,/,
    'name-suggestions endpoint should require checkJwt'
  );
  assert.match(
    source,
    /router\.get\('\/items\/search',\s*checkJwt,/,
    'search endpoint should require checkJwt'
  );
  assert.match(
    source,
    /router\.get\('\/items\/search-text',\s*checkJwt,/,
    'search-text endpoint should require checkJwt'
  );
});

test.after(async () => {
  await db.destroy();
  await appDb.destroy();
});
