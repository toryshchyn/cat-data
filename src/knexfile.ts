import { Knex } from 'knex';
const rootConfig = require('../knexfile');

const typedConfig = rootConfig as { [key: string]: Knex.Config };

export default typedConfig;