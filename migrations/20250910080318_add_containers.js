/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('containers', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable().unique();
    table.text('description').defaultTo('');
  });

  await knex.schema.alterTable('items', (table) => {
    table
      .integer('container_id')
      .unsigned()
      .references('id')
      .inTable('containers')
      .onDelete('RESTRICT');
  });

  const inserted = await knex('containers')
    .insert({ name: 'Default', description: 'Auto-created container' })
    .returning(['id']);

  const defaultContainerId = Array.isArray(inserted)
    ? (inserted[0]?.id ?? inserted[0])
    : inserted;

  await knex('items').update({ container_id: defaultContainerId });

  await knex.schema.alterTable('items', (table) => {
    table.integer('container_id').unsigned().notNullable().alter();
    table.index(['container_id'], 'idx_items_container');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const hasContainerId = await knex.schema.hasColumn('items', 'container_id');
  if (hasContainerId) {
    await knex.schema.alterTable('items', (table) => {
      table.dropIndex(['container_id'], 'idx_items_container');
      table.dropColumn('container_id');
    });
  }

  await knex.schema.dropTableIfExists('containers');
};
