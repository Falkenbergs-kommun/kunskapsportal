import * as migration_20251014_064041_initial_schema from './20251014_064041_initial_schema';
import * as migration_20251022_085345 from './20251022_085345';
import * as migration_20251031_110805 from './20251031_110805';
import * as migration_20251110_094027 from './20251110_094027';

export const migrations = [
  {
    up: migration_20251014_064041_initial_schema.up,
    down: migration_20251014_064041_initial_schema.down,
    name: '20251014_064041_initial_schema',
  },
  {
    up: migration_20251022_085345.up,
    down: migration_20251022_085345.down,
    name: '20251022_085345',
  },
  {
    up: migration_20251031_110805.up,
    down: migration_20251031_110805.down,
    name: '20251031_110805',
  },
  {
    up: migration_20251110_094027.up,
    down: migration_20251110_094027.down,
    name: '20251110_094027',
  },
];
