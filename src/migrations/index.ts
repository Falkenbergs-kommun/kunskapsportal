import * as migration_20251014_064041_initial_schema from './20251014_064041_initial_schema';
import * as migration_20251022_085345 from './20251022_085345';

export const migrations = [
  {
    up: migration_20251014_064041_initial_schema.up,
    down: migration_20251014_064041_initial_schema.down,
    name: '20251014_064041_initial_schema',
  },
  {
    up: migration_20251022_085345.up,
    down: migration_20251022_085345.down,
    name: '20251022_085345'
  },
];
