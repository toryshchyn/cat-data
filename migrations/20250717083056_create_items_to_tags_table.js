/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('items_to_tags', (table) => {
        table.increments('id').primary();
        table.integer('item_id').unsigned().references('id').inTable('items').onDelete('CASCADE');
        table.integer('tag_id').unsigned().references('id').inTable('tags').onDelete('CASCADE');
    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('items_to_tags');
};
